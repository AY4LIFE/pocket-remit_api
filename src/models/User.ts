import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({select: false})
  password_hash!: string;

  @Column()
  full_name!: string;

  @Column({ type: "enum", enum: ["customer", "admin"], default: "customer" })
  role!: "customer" | "admin";

  @CreateDateColumn()
  created_at!: Date;
}