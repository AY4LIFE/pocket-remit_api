import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClientReferenceToTransaction1784534408914 implements MigrationInterface {
    name = 'AddClientReferenceToTransaction1784534408914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" ADD "clientReference" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "UQ_3b35593cae1d7f3c40860659844" UNIQUE ("clientReference")`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "narration" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "narration"`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "narration" boolean`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "UQ_3b35593cae1d7f3c40860659844"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "clientReference"`);
    }

}
