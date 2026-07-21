import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompositeUniqueClientReference1784626823263 implements MigrationInterface {
    name = 'AddCompositeUniqueClientReference1784626823263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" ADD "clientReference" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "narration"`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "narration" character varying`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3b35593cae1d7f3c4086065984" ON "transaction" ("clientReference") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_3b35593cae1d7f3c4086065984"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "narration"`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "narration" boolean`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "clientReference"`);
    }

}
