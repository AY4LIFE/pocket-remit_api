import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddClientReferenceToTransaction1784534408914 implements MigrationInterface {
    name = 'AddClientReferenceToTransaction1784534408914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        
        await queryRunner.query(`
            ALTER TABLE "transaction"
            ADD "clientReference" character varying NOT NULL
        `);

        // ------------------------------------
        // COMPOSITE UNIQUE CONSTRAINT
        // Unique per sender + clientReference combination
        // NOT globally unique — two different users
        // can use the same reference string
        // ------------------------------------
        await queryRunner.query(`
            ALTER TABLE "transaction"
            ADD CONSTRAINT "UQ_clientReference_sender"
            UNIQUE ("clientReference", "senderId")
        `);

        // ------------------------------------
        // FIX NARRATION COLUMN TYPE
        // InitialSchema created narration as boolean (bug)
        // ALTER COLUMN changes the type to varchar
        // without dropping or losing existing data
        // ------------------------------------
        await queryRunner.query(`
            ALTER TABLE "transaction"
            ALTER COLUMN "narration" TYPE character varying
            USING narration::text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert narration back to its previous type before the migration was applied
        await queryRunner.query(`
            ALTER TABLE "transaction"
            ALTER COLUMN "narration" TYPE boolean
            USING narration::boolean
        `);

        // Drop the composite unique constraint
        await queryRunner.query(`
            ALTER TABLE "transaction"
            DROP CONSTRAINT "UQ_clientReference_sender"
        `);

        // Drop the clientReference column
        await queryRunner.query(`
            ALTER TABLE "transaction"
            DROP COLUMN "clientReference"
        `);
    }
}