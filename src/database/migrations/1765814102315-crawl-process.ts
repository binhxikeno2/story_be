import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1765814102315 implements MigrationInterface {
    name = 'Migrations1765814102315'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`crawl_process\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, \`status\` enum ('inprogress', 'crawled', 'error') NULL, \`started_at\` timestamp NOT NULL, \`ended_process_at\` timestamp NOT NULL, \`numberOfPostCrawled\` bigint NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`crawl_process\``);
    }

}
