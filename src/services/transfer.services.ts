import {AppDataSource} from'../config/database.js'
import {TransferRepository} from '../repositories/transfer.repository.js'
import {Wallet} from '../models/Wallet.js'
import {InitiateTransferDto} from '../dto/transfer.dto.js'
import {Transaction} from '../models/Transaction.js'
import {getProvider} from '../providers/provider.router.js'
import devLogger from '../utils/logger.js'

const logger = devLogger()
export class TransferService{
    private transferRepo = new TransferRepository()
    private walletRepo = AppDataSource.getRepository(Wallet)

    async getWallet(userId: string, dto: InitiateTransferDto): Promise<Wallet | null> {
        return await this.walletRepo.findOne({
            where: {
                user: {id: userId},
                currency: dto.currency
            }
        })
    }

    async initiateTransfer(
        userId: string,
        dto: InitiateTransferDto
    ): Promise<Transaction>{

        const existingTransaction = await this.transferRepo.findByClientReference(dto.clientReference, userId)
        if(existingTransaction){
            logger.info('Duplicate transfer attempt detected', {
                userId,
                clientReference: dto.clientReference,
                transactionId: existingTransaction.id
            })
            return existingTransaction
        }
        // Step 1: Look up the recipient
        // Verify the account exists and get the holder's name
        const provider = getProvider(dto.currency)
        const {accountName} = await provider.lookupAccount(
            dto.recipientAccount
        )

        // Step 2: DB Transaction
        // Balance check and Debit now happen together
        // inside the bubble with a row-level lock

        // querryRunner gives us finer control than
        // the AppDataSource.transaction() method
        // we need it for pessimistic locking
        const queryRunner = AppDataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        let transaction: Transaction

        try{
            // Lock the Wallet Row
            const wallet = await queryRunner.manager.findOne(Wallet, {
                where: {
                    user: {id: userId},
                    currency: dto.currency
                },
                lock: {mode: 'pessimistic_write'}
            })

            if (!wallet){
                logger.warn('Transfer attempted with no wallet',{
                    userId,
                    currency: dto.currency
                })
                throw new Error(`You don't have a ${dto.currency} wallet`)
            }

            if (Number(wallet.balance) < dto.amount){
                logger.warn('Transfer attempted with insufficient balance',{
                    userId,
                    walletId: wallet.id,
                    attempted: dto.amount,
                    currency: dto.currency,
                })
                throw new Error(`Insufficient balance`)
            }

            // Deduct the wallet balance
            await queryRunner.manager.decrement(
                Wallet,
                {id: wallet.id},
                'balance',
                dto.amount
            )

            // Create the transaction record as pending
            const newTransaction = queryRunner.manager.create(Transaction,{
                sender: {id: userId},
                senderWalletId: wallet.id,
                amount: dto.amount,
                currency: dto.currency,
                recipientName: accountName,
                recipientAccountNumber: dto.recipientAccount,
                bankCode: dto.bankCode,
                narration: dto.narration,
                clientReference: dto.clientReference,
                status: 'pending'
            } as any)

            transaction = await queryRunner.manager.save(newTransaction)
            // Commit - wallet debited and record created atomically
            await queryRunner.commitTransaction()
        } catch(error){
            // Rollback
            // If anything inside fails, undo everything automatically
            await queryRunner.rollbackTransaction()
            throw error
        }
        finally{
            // Always release the queryRunner, otherwise it leaks DB connections
            await queryRunner.release()
        }
        logger.info('Transfer initiated', {
            userId,
            transactionId: transaction.id,
            amount: dto.amount,
            currency: dto.currency,
            recipientAccount: dto.recipientAccount,
            bankCode: dto.bankCode,
            provider: provider.name
        })

        // Step 3: Call the bank (Outside the DB Transaction)
        let result: any
        try{
            result = await provider.initiateTransfer({
                fromAccount: transaction.senderWalletId,
                toAccount: dto.recipientAccount,
                toBankCode: dto.bankCode,
                amount: dto.amount,
                currency: dto.currency,
                narration: dto.narration || ''
            })

        } catch (error){
            // A provider timeout does not mean the transfer failed - it may have gone through
            logger.error('Transfer failed - provider did not respond', {
                userId,
                transactionId: transaction.id,
                provider: provider.name,
                amount: dto.amount,
                currency: dto.currency,
                error: error instanceof Error ? error.message : String(error)
            })

            await this.transferRepo.updateStatus(transaction.id, 'failed', 'N/A')

            try{
                await this.walletRepo.increment(
                    {id: transaction.senderWalletId},
                    'balance',
                    dto.amount
                )
                logger.info('Compensating credit applied - wallet refunded', {
                    userId,
                    walletId: transaction.senderWalletId,
                    amount: dto.amount,
                    currency: dto.currency,
                    transactionId: transaction.id
                })
            }catch(refundError){
                // CRITICAL - refund failed
                logger.error('CRITICAL: Compensating credit failed - manual intervention required', {
                    userId,
                    walletId: transaction.senderWalletId,
                    amount: dto.amount,
                    currency: dto.currency,
                    transactionId: transaction.id
                })
            }
            throw new Error('Transfer failed: Bank Provider did not respond')
        }

        if (result.status === 'pending'){
            logger.info('Transfer is pending - provider did not respond', {
                userId,
                transactionId: transaction.id,
                provider: provider.name,
                amount: dto.amount,
                currency: dto.currency
            })
        } else if (result.status === 'success'){
            logger.info('Transfer successful', {
                userId,
                transactionId: transaction.id,
                provider: provider.name,
                amount: dto.amount,
                currency: dto.currency
            })
        }

        // Bank returned status: 'failed' - money never moved - refund wallet
        if (result.status === 'failed'){
            logger.warn('Transfer rejected by provider - refunding wallet', {
                userId,
                transactionId: transaction.id,
                provider: provider.name,
                amount: dto.amount,
                currency: dto.currency
            })
            await this.transferRepo.updateStatus(transaction.id, 'failed', result.providerReference)

            try{
                await this.walletRepo.increment(
                    {id: transaction.senderWalletId},
                    'balance',
                    dto.amount
                )
                logger.info('Compensating credit applied - wallet refunded after provider rejection', {
                    userId,
                    walletId: transaction.senderWalletId,
                    amount: dto.amount,
                    transactionId: transaction.id
                })
            }catch(refundError){
                // CRITICAL - refund failed
                logger.error('CRITICAL: Compensating credit failed after provider rejection - manual intervention required', {
                    userId,
                    walletId: transaction.senderWalletId,
                    amount: dto.amount,
                    transactionId: transaction.id
                })
            }

            return {...transaction, status: 'failed'}
        }
        
        try{
            await this.transferRepo.updateStatus(
                transaction.id,
                result.status,
                result.providerReference
             )
            logger.info('Transfer status updated,', {
                userId,
                transactionId: transaction.id,
                providerReference: result.providerReference,
                status: result.status,
                provider: provider.name
            })
        } catch(updateError){
            // Money was sent - DO NOT REFUND, just log for manual fix
            logger.error('CRITICAL: Failed to update transfer status - manual intervention required', {
                userId,
                transactionId: transaction.id,
                providerReference: result.providerReference,
                status: result.status,
                provider: provider.name
            })
        }
        return {...transaction, status: result.status}
    }

    // GET TRANSACTIONS
    async getTransaction(
        userId: string,
        page: number,
        limit: number
    ): Promise<{data: Transaction[], total: number, page: number, pages: number}>{
        const offset = (page - 1) * limit
        const [transactions, total] = await this.transferRepo.findByUser(
            userId,
            limit,
            offset
        )
        return {
            data: transactions,
            total,
            page,
            pages: Math.ceil(total / limit)
        }
    }

    // GET TRANSACTIONS BY ID
    async getTransactionById(
        userId: string,
        transactionId: string
    ): Promise<Transaction>{
        const transaction = await this.transferRepo.findById(transactionId)

        if (!transaction){
            throw new Error('Transaction not found')
        }

        if (transaction.sender.id !== userId){
            throw new Error('Unauthorized')
        }
        return transaction
    }

    // Refresh Status for GlobalBank 'pending' transfer
    async refreshStatus(
        userId: string,
        transactionId: string
    ): Promise<Transaction>{
        const transaction = await this.getTransactionById(userId, transactionId)
        // Already resolved? = no need to call the bank again
        if (transaction.status !== 'pending'){
            return transaction
        }

        const provider = getProvider(transaction.currency)
        const result = await provider.getTransferStatus(transaction.providerReference)

        await this.transferRepo.updateStatus(
        transaction.id,
        result.status,
        result.providerReference
    )

    logger.info('Transfer status refreshed', {
        userId,
        transactionId: transaction.id,
        providerReference: result.providerReference,
        status: result.status,
        provider: provider.name
    })
    return {...transaction, status: result.status}
    }
}