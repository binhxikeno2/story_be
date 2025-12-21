import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1766323296579 implements MigrationInterface {
    name = 'Migrations1766323296579'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`crawl_process\` CHANGE \`ended_process_at\` \`ended_process_at\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`crawl_process\` CHANGE \`ended_process_at\` \`ended_process_at\` timestamp NOT NULL`);
    }

}
