import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1766423669535 implements MigrationInterface {
    name = 'Migrations1766423669535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`category\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(150) NOT NULL, \`slug\` varchar(180) NOT NULL, \`description\` text NULL, \`thumbnailUrl\` varchar(500) NULL, \`url3thParty\` varchar(500) NULL, UNIQUE INDEX \`IDX_23c05c292c439d77b0de816b50\` (\`name\`), UNIQUE INDEX \`IDX_cb73208f151aa71cdd78f662d7\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`chapter\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`postId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`crawl_process\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, \`status\` enum ('created', 'running_page', 'running_detail', 'finalizing', 'crawled', 'error', 'paused', 'cancelled', 'pending', 'running', 'done', 'failed') NULL, \`limit_time\` bigint NULL, \`page_from\` bigint NOT NULL, \`page_to\` bigint NOT NULL, \`started_at\` timestamp NOT NULL, \`ended_process_at\` timestamp NULL, \`numberOfPostCrawled\` bigint NULL, \`categoryId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`crawl_process_page\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`process_id\` int NOT NULL, \`page_no\` bigint NOT NULL, \`url\` varchar(800) NOT NULL, \`status\` enum ('created', 'running_page', 'running_detail', 'finalizing', 'crawled', 'error', 'paused', 'cancelled', 'pending', 'running', 'done', 'failed') NOT NULL DEFAULT 'pending', \`found_count\` bigint NULL, \`last_error\` text NULL, \`started_at\` timestamp NULL, \`ended_at\` timestamp NULL, INDEX \`IDX_eb1499fdf119ff228bb2cf66b2\` (\`process_id\`, \`status\`), UNIQUE INDEX \`IDX_2c8e37f050e987104573a6495e\` (\`process_id\`, \`page_no\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`email\` varchar(128) NOT NULL, \`password\` varchar(100) NOT NULL, \`name\` varchar(128) NOT NULL, UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`personal_token\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`token\` text NOT NULL, \`expires_in\` varchar(128) NOT NULL, \`user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`story\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`media\` varchar(500) NOT NULL, \`chapterId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`post\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`tags\` text NULL, \`categoryId\` int NULL, \`thumbnailUrl\` varchar(500) NULL, \`lastUpdated\` timestamp NULL, \`isRead\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`crawl_process_item\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`process_page_id\` int NOT NULL, \`detail_url\` varchar(1000) NOT NULL, \`status\` enum ('created', 'running_page', 'running_detail', 'finalizing', 'crawled', 'error', 'paused', 'cancelled', 'pending', 'running', 'done', 'failed') NOT NULL DEFAULT 'pending', \`post_id\` int NULL, \`last_error\` text NULL, \`started_at\` timestamp NULL, \`ended_at\` timestamp NULL, INDEX \`IDX_5bc251fd4b3288b6a9540ffdb9\` (\`process_page_id\`, \`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`chapter\` ADD CONSTRAINT \`FK_2f50b61b80b0905a94785a4f8bf\` FOREIGN KEY (\`postId\`) REFERENCES \`post\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crawl_process\` ADD CONSTRAINT \`FK_53edeba9b62a1cd8ef56e0ded85\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crawl_process_page\` ADD CONSTRAINT \`FK_757b20926513d2703c78315798c\` FOREIGN KEY (\`process_id\`) REFERENCES \`crawl_process\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`personal_token\` ADD CONSTRAINT \`FK_56d921cc9e826338e2548526ea2\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`story\` ADD CONSTRAINT \`FK_b84d6c3cbb730fecc0061cf3e99\` FOREIGN KEY (\`chapterId\`) REFERENCES \`chapter\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`post\` ADD CONSTRAINT \`FK_1077d47e0112cad3c16bbcea6cd\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crawl_process_item\` ADD CONSTRAINT \`FK_7a9b9d49e0812c0b0afa7676bd6\` FOREIGN KEY (\`process_page_id\`) REFERENCES \`crawl_process_page\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crawl_process_item\` ADD CONSTRAINT \`FK_f9bd69b1e2c45d39696410df565\` FOREIGN KEY (\`post_id\`) REFERENCES \`post\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`crawl_process_item\` DROP FOREIGN KEY \`FK_f9bd69b1e2c45d39696410df565\``);
        await queryRunner.query(`ALTER TABLE \`crawl_process_item\` DROP FOREIGN KEY \`FK_7a9b9d49e0812c0b0afa7676bd6\``);
        await queryRunner.query(`ALTER TABLE \`post\` DROP FOREIGN KEY \`FK_1077d47e0112cad3c16bbcea6cd\``);
        await queryRunner.query(`ALTER TABLE \`story\` DROP FOREIGN KEY \`FK_b84d6c3cbb730fecc0061cf3e99\``);
        await queryRunner.query(`ALTER TABLE \`personal_token\` DROP FOREIGN KEY \`FK_56d921cc9e826338e2548526ea2\``);
        await queryRunner.query(`ALTER TABLE \`crawl_process_page\` DROP FOREIGN KEY \`FK_757b20926513d2703c78315798c\``);
        await queryRunner.query(`ALTER TABLE \`crawl_process\` DROP FOREIGN KEY \`FK_53edeba9b62a1cd8ef56e0ded85\``);
        await queryRunner.query(`ALTER TABLE \`chapter\` DROP FOREIGN KEY \`FK_2f50b61b80b0905a94785a4f8bf\``);
        await queryRunner.query(`DROP TABLE \`crawl_process_item\``);
        await queryRunner.query(`DROP TABLE \`post\``);
        await queryRunner.query(`DROP TABLE \`story\``);
        await queryRunner.query(`DROP TABLE \`personal_token\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_2c8e37f050e987104573a6495e\` ON \`crawl_process_page\``);
        await queryRunner.query(`DROP INDEX \`IDX_eb1499fdf119ff228bb2cf66b2\` ON \`crawl_process_page\``);
        await queryRunner.query(`DROP TABLE \`crawl_process_page\``);
        await queryRunner.query(`DROP TABLE \`crawl_process\``);
        await queryRunner.query(`DROP TABLE \`chapter\``);
        await queryRunner.query(`DROP INDEX \`IDX_cb73208f151aa71cdd78f662d7\` ON \`category\``);
        await queryRunner.query(`DROP INDEX \`IDX_23c05c292c439d77b0de816b50\` ON \`category\``);
        await queryRunner.query(`DROP TABLE \`category\``);
    }

}
