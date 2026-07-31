import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783513426151 implements MigrationInterface {
    name = 'InitialSchema1783513426151'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ------------------------------------
        // ENUMS
        // Create custom types first before tables that use them
        // ------------------------------------

        // ENABLE UUID EXTENSION
        // uuid_generate_v4() requires this extension to exist.
        // IF NOT EXISTS means it won't fail if already enabled.
        // This must run BEFORE any table that uses uuid as a primary key.

        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
        
        await queryRunner.query(`
            CREATE TYPE "public"."user_role_enum"
            AS ENUM('customer', 'admin')
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."transaction_status_enum"
            AS ENUM('pending', 'success', 'failed')
        `);

        // ------------------------------------
        // USER TABLE
        // Created first because Wallet and Transaction
        // both have foreign keys referencing it
        // ------------------------------------
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password_hash" character varying NOT NULL,
                "full_name" character varying NOT NULL,
                "role" "public"."user_role_enum" NOT NULL DEFAULT 'customer',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"),
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);

        // ------------------------------------
        // WALLET TABLE
        // References User via user_id foreign key
        // ------------------------------------
        await queryRunner.query(`
            CREATE TABLE "wallet" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "currency" character varying NOT NULL,
                "balance" numeric(18,4) NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334" PRIMARY KEY ("id")
            )
        `);

        // ------------------------------------
        // TRANSACTION TABLE
        // References User via senderId foreign key
        // ------------------------------------
        await queryRunner.query(`
            CREATE TABLE "transaction" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "senderWalletId" character varying NOT NULL,
                "amount" numeric(18,4) NOT NULL,
                "currency" character varying NOT NULL,
                "recipientName" character varying NOT NULL,
                "recipientAccountNumber" character varying NOT NULL,
                "bankCode" character varying NOT NULL,
                "narration" character varying NOT NULL,
                "providerReference" character varying,
                "status" "public"."transaction_status_enum" NOT NULL DEFAULT 'pending',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "senderId" uuid,
                CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id")
            )
        `);

        // ------------------------------------
        // FOREIGN KEYS
        // Added after all tables exist so references work
        // ------------------------------------
        await queryRunner.query(`
            ALTER TABLE "wallet"
            ADD CONSTRAINT "FK_72548a47ac4a996cd254b082522"
            FOREIGN KEY ("user_id") REFERENCES "user"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "transaction"
            ADD CONSTRAINT "FK_ed3e32981d7a640be5480effecf"
            FOREIGN KEY ("senderId") REFERENCES "user"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // ------------------------------------
        // DOWN METHOD — the "undo" button
        // Drops everything in REVERSE order
        // Foreign keys first, then tables, then enums
        // ------------------------------------
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_ed3e32981d7a640be5480effecf"`);
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "FK_72548a47ac4a996cd254b082522"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TABLE "wallet"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }
}