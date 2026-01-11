import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1768108364387 implements MigrationInterface {
    name = 'Migrations1768108364387'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`story\` ADD \`internal_url\` varchar(500) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`story\` DROP COLUMN \`internal_url\``);
    }

}
