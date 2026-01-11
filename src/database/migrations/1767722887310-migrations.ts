import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1767722887310 implements MigrationInterface {
    name = 'Migrations1767722887310'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`email\` varchar(128) NOT NULL, \`password\` varchar(100) NOT NULL, \`name\` varchar(128) NOT NULL, UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`personal_token\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`token\` text NOT NULL, \`expires_in\` varchar(128) NOT NULL, \`user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`post\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`tags\` text NULL, \`category_id\` int NULL, \`thumbnail_url\` varchar(500) NULL, \`last_updated\` timestamp NULL, \`is_read\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`category\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(150) NOT NULL, \`slug\` varchar(180) NOT NULL, \`description\` text NULL, \`thumbnail_url\` varchar(500) NULL, \`url_3th_party\` varchar(500) NULL, \`parent_id\` int NULL, UNIQUE INDEX \`IDX_23c05c292c439d77b0de816b50\` (\`name\`), UNIQUE INDEX \`IDX_cb73208f151aa71cdd78f662d7\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`crawl_category\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, \`status\` enum ('created', 'running_page', 'running_detail', 'finalizing', 'crawled', 'error', 'paused', 'cancelled', 'pending', 'running', 'done', 'failed', 'duplicate', 'not_new_page') NULL, \`limit_time\` bigint NULL, \`page_from\` bigint NULL, \`page_to\` bigint NULL, \`started_at\` timestamp NOT NULL, \`ended_process_at\` timestamp NULL, \`number_of_post_crawled\` bigint NULL, \`category_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`crawl_category_item\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`process_id\` int NOT NULL, \`page_no\` bigint NOT NULL, \`url\` varchar(800) NOT NULL, \`status\` enum ('created', 'running_page', 'running_detail', 'finalizing', 'crawled', 'error', 'paused', 'cancelled', 'pending', 'running', 'done', 'failed', 'duplicate', 'not_new_page') NOT NULL DEFAULT 'pending', \`found_count\` bigint NULL, \`last_error\` text NULL, \`started_at\` timestamp NULL, \`ended_at\` timestamp NULL, INDEX \`IDX_e786074c3e9320e2b3c9694334\` (\`process_id\`, \`status\`), UNIQUE INDEX \`IDX_0000c3c2d5a194b7f3ea6bada9\` (\`process_id\`, \`page_no\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`crawl_category_detail\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`process_page_id\` int NOT NULL, \`detail_url\` varchar(1000) NOT NULL, \`status\` enum ('created', 'running_page', 'running_detail', 'finalizing', 'crawled', 'error', 'paused', 'cancelled', 'pending', 'running', 'done', 'failed', 'duplicate', 'not_new_page') NOT NULL DEFAULT 'pending', \`post_id\` int NULL, \`last_error\` text NULL, \`started_at\` timestamp NULL, \`ended_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`chapter\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`post_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`story\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`media\` varchar(500) NOT NULL, \`rapid_gator_url\` varchar(500) NULL, \`chapter_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`personal_token\` ADD CONSTRAINT \`FK_56d921cc9e826338e2548526ea2\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`post\` ADD CONSTRAINT \`FK_388636ba602c312da6026dc9dbc\` FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`category\` ADD CONSTRAINT \`FK_1117b4fcb3cd4abb4383e1c2743\` FOREIGN KEY (\`parent_id\`) REFERENCES \`category\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crawl_category\` ADD CONSTRAINT \`FK_68461225d5c840a0a969388503c\` FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crawl_category_item\` ADD CONSTRAINT \`FK_37ce13143564ee0a5cc4bbd206a\` FOREIGN KEY (\`process_id\`) REFERENCES \`crawl_category\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crawl_category_detail\` ADD CONSTRAINT \`FK_d5207b3bf1796ebdb2b1ebd8f5a\` FOREIGN KEY (\`process_page_id\`) REFERENCES \`crawl_category_item\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crawl_category_detail\` ADD CONSTRAINT \`FK_28926c593290d346bcdf8dff6ba\` FOREIGN KEY (\`post_id\`) REFERENCES \`post\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chapter\` ADD CONSTRAINT \`FK_63b207b89ef1961aeabd85cb7b4\` FOREIGN KEY (\`post_id\`) REFERENCES \`post\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`story\` ADD CONSTRAINT \`FK_f503bf57b6d0cc9199e10277cc3\` FOREIGN KEY (\`chapter_id\`) REFERENCES \`chapter\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`story\` DROP FOREIGN KEY \`FK_f503bf57b6d0cc9199e10277cc3\``);
        await queryRunner.query(`ALTER TABLE \`chapter\` DROP FOREIGN KEY \`FK_63b207b89ef1961aeabd85cb7b4\``);
        await queryRunner.query(`ALTER TABLE \`crawl_category_detail\` DROP FOREIGN KEY \`FK_28926c593290d346bcdf8dff6ba\``);
        await queryRunner.query(`ALTER TABLE \`crawl_category_detail\` DROP FOREIGN KEY \`FK_d5207b3bf1796ebdb2b1ebd8f5a\``);
        await queryRunner.query(`ALTER TABLE \`crawl_category_item\` DROP FOREIGN KEY \`FK_37ce13143564ee0a5cc4bbd206a\``);
        await queryRunner.query(`ALTER TABLE \`crawl_category\` DROP FOREIGN KEY \`FK_68461225d5c840a0a969388503c\``);
        await queryRunner.query(`ALTER TABLE \`category\` DROP FOREIGN KEY \`FK_1117b4fcb3cd4abb4383e1c2743\``);
        await queryRunner.query(`ALTER TABLE \`post\` DROP FOREIGN KEY \`FK_388636ba602c312da6026dc9dbc\``);
        await queryRunner.query(`ALTER TABLE \`personal_token\` DROP FOREIGN KEY \`FK_56d921cc9e826338e2548526ea2\``);
        await queryRunner.query(`DROP TABLE \`story\``);
        await queryRunner.query(`DROP TABLE \`chapter\``);
        await queryRunner.query(`DROP TABLE \`crawl_category_detail\``);
        await queryRunner.query(`DROP INDEX \`IDX_0000c3c2d5a194b7f3ea6bada9\` ON \`crawl_category_item\``);
        await queryRunner.query(`DROP INDEX \`IDX_e786074c3e9320e2b3c9694334\` ON \`crawl_category_item\``);
        await queryRunner.query(`DROP TABLE \`crawl_category_item\``);
        await queryRunner.query(`DROP TABLE \`crawl_category\``);
        await queryRunner.query(`DROP INDEX \`IDX_cb73208f151aa71cdd78f662d7\` ON \`category\``);
        await queryRunner.query(`DROP INDEX \`IDX_23c05c292c439d77b0de816b50\` ON \`category\``);
        await queryRunner.query(`DROP TABLE \`category\``);
        await queryRunner.query(`DROP TABLE \`post\``);
        await queryRunner.query(`DROP TABLE \`personal_token\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
    }

}
