import { DataSource } from "typeorm";
import "reflect-metadata";
import "dotenv/config";
import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { Transaction } from "../models/Transaction.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: 5432,
  username: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
  database: process.env.POSTGRES_DB!,
  synchronize: false,
  // ------------------------------------
  // ENTITIES IMPORTED DIRECTLY
  // Instead of a glob pattern like "dist/models/*.js"
  // which breaks in test environments, we import each
  // entity explicitly. TypeORM always finds them this way
  // regardless of environment.
  // ------------------------------------
  entities: [User, Wallet, Transaction],
  logging: false,
  // ------------------------------------
  // MIGRATIONS
  // TypeORM will look for compiled migration files here.
  // These files describe exactly what changes to make to the database
  // ------------------------------------
  migrations: ["src/migrations/*.ts"],
  // ------------------------------------
  // MIGRATIONS TABLE NAME
  // TypeORM creates a special table in your DB to track
  // which migrations have already run - so it never run the
  // same migration twice.
  // ------------------------------------
  migrationsTableName: "migrations",
});