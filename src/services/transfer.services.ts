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

        // Step 1: Check Balance
        const wallet = await this.getWallet(userId, dto)

        if (!wallet){
            logger.warn('Transfer attempted with no wallet', {
                userId,
                currency: dto.currency
            })
            throw new Error(`You don't have a ${dto.currency} wallet`)
        }
        if (Number(wallet.balance) < dto.amount){
            logger.warn('Transfer attempted with insufficient balance,',{
                userId,
                walletId: wallet.id,
                attempted: dto.amount,
                currency: dto.currency
            })
            throw new Error('Insufficient balance')
        }

        // Step 2: Look up the recipient
        // Verify the account exists and get the holder's name
        const provider = getProvider(dto.currency)
        const {accountName} = await provider.lookupAccount(
            dto.recipientAccount
        )

        // Step 3: Debit Wallet and Create Transaction Record
        // Both happen atomically in one DB Transaction
        const transaction = await AppDataSource.transaction(
            async (entityManager) => {
                // Deduct the wallet balance
                await entityManager.decrement(
                    Wallet,
                    {id: wallet.id},
                    'balance',
                    dto.amount
                )

                // Create the transaction record as pending
                const newTransaction = entityManager.create(Transaction, {
                    sender: {id: userId},
                    senderWalletId: wallet.id,
                    amount: dto.amount,
                    currency: dto.currency,
                    recipientName: accountName,
                    recipientAccountNumber: dto.recipientAccount,
                    bankCode: dto.bankCode,
                    narration: dto.narration,
                    status: 'pending'
                } as any)

                return await entityManager.save(newTransaction)
                // DB transaction commits here
                // Wallet is debited. Record exists. safe to call bank
            }
        )

        logger.info('Transfer initiated', {
            userId,
            transactionId: transaction.id,
            amount: dto.amount,
            currency: dto.currency,
            recipientAccount: dto.recipientAccount,
            bankCode: dto.bankCode,
            provider: provider.name
        })

        //Step 4: Call the bank
        try{
            const result = await provider.initiateTransfer({
                fromAccount: wallet.id,
                toAccount: dto.recipientAccount,
                toBankCode: dto.bankCode,
                amount: dto.amount,
                currency: dto.currency,
                narration: dto.narration || ''
            })

        // Step 5: Update Transaction Status
            await this.transferRepo.updateStatus(
                transaction.id,
                result.status,
                result.providerReference
            )
            logger.info('Transfer status updated', {
                userId,
                transactionId: transaction.id,
                status: result.status,
                providerReference: result.providerReference,
                provider: provider.name
            })
            return {...transaction, status: result.status}

        }catch(error){
            // Bank call failed entirely - mark as failed
            // The record still exists so there is always a paper trail
            logger.error('Transfer failed - provider did not respond', {
                userId,
                transactionId: transaction.id,
                provider: provider.name,
                amount: dto.amount,
                currency: dto.currency
            })
            await this.transferRepo.updateStatus(
                transaction.id,
                'failed',
                'N/A'
            )
            throw new Error('Transfer failed: Bank Provider did not respond')
        }
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
        const result = await provider.initiateTransfer({
            fromAccount: transaction.senderWalletId,
            toAccount: transaction.recipientAccountNumber,
            toBankCode: transaction.bankCode,
            amount: transaction.amount,
            currency: transaction.currency,
            narration: transaction.narration || ''
        }as any)
    
    await this.transferRepo.updateStatus(
        transaction.id,
        result.status,
        result.providerReference
    )
    return {...transaction, status: result.status}
    }
}