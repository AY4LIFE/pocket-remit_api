import { DataSource } from "typeorm";
import "reflect-metadata";
import "dotenv/config";
import "reflect-metadata";


export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: 5432,
  username: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
  database: process.env.POSTGRES_DB!,
  synchronize: true,
  entities: ["dist/models/*.js"],
  logging: false,
});