import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.js";

@Entity()

export class Wallet {

 @PrimaryGeneratedColumn('uuid')
 id!: string;

 @ManyToOne(() => User, {eager: true})
 @JoinColumn({name: "user_id"})
 user!: User;

 @Column()
 currency!: string; // 'NGN' | 'USD' | 'GHS'


 @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
 balance!: string; // Lesson: why decimal, not float, for money
 

 @CreateDateColumn()
 createdAt!: Date;
}