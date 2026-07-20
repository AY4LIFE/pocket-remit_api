import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn
} from 'typeorm'
import {User} from './User.js'

// ------------------------------------
// TRANSACTION ENTITY
// This creates the "transaction" table in the database.
// Every completed (or attempted) transfer gets one row here.
// ------------------------------------
@Entity()
export class Transaction{
    @PrimaryGeneratedColumn('uuid')
    id!: string

    // ------------------------------------
  // SENDER RELATIONSHIP
  // Instead of storing the user's name/email directly,
  // we store a reference to the User entity.
  // TypeORM will handle the JOIN when you need the name.
  //
  // ManyToOne means: one User can have MANY transactions
  // but each transaction belongs to ONE user
  // ------------------------------------
  @ManyToOne(() => User)
  sender!: User

  // We also store the wallet ID separately so we know
  // exactly which wallet was debited (remember, one user
  // can have multiple wallets in different currencies)
  @Column()
  senderWalletId!: string

  @Column({type: 'decimal', precision: 18, scale:4})
  amount!: number

  @Column()
  currency!: string

  // ------------------------------------
  // RECIPIENT FIELDS
  // These come from two sources:
  //   - recipientName → returned by provider.lookupAccount()
  //   - accountNumber and bankCode → sent by the user in the request
  // ------------------------------------
  @Column()
  recipientName!: string

  @Column()
  recipientAccountNumber!: string

  @Column()
  bankCode!: string

  @Column({nullable: true})
  narration?: string

  // ------------------------------------
  // PROVIDER FIELDS
  // These come back from the bank after initiateTransfer() is called.
  // This is what links YOUR transaction record to the BANK'S record.
  // If there's ever a dispute, you use providerReference to trace it.
  // ------------------------------------
  @Column({nullable: true})
  providerReference!: string

  @Column({
    type: 'enum',
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  })
  status!: 'pending' | 'success' | 'failed'

  @CreateDateColumn()
  createdAt!: Date

  @Column({unique: true})
  clientReference!: string // This makes the DB enforce no duplicate transfers
}