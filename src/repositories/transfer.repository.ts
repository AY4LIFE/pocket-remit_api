import {AppDataSource} from '../config/database.js'
import {Transaction} from '../models/Transaction.js'

export class TransferRepository{

    // ------------------------------------
  // REPO
  // AppDataSource.getRepository() gives us a TypeORM repository
  // pre-configured for the Transaction entity.
  // This is what actually talks to the database.
  // ------------------------------------
  private repo = AppDataSource.getRepository(Transaction)

  // Save a new transaction record to the database
  async save(transaction: Partial<Transaction>): 
  Promise<Transaction>{
    const newTransaction = this.repo.create(transaction)
    return await this.repo.save(transaction)
  }

  // Fetch all transactions for a specific user
  // Using the pagination prarameters: limit and offset
  async findByUser(
    userId: string,
    limit: number,
    offset: number
  ): Promise<[Transaction[], number]>{
    return await this.repo.findAndCount({
        where: {
            sender: {id: userId},

        },
        order: {createdAt: 'DESC'},
        take: limit,
        skip: offset,
        relations: ['sender']
    })
  }

  // Fetch a single transaction by its ID
  async findById(id: string): Promise<Transaction | null>{
    return await this.repo.findOne({
        where: {id},
        relations: ['sender'] // JOIN the User so sender details are available
    })
  }

  // Update the status of a transaction after we hear back
  // from the bank provider
  async updateStatus(
    id: string,
    status: 'pending' | 'success' | 'failed',
    providerReference: string
    ): Promise<void>{
        await this.repo.update(id, {status, providerReference})
    }
}