import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1768843371594 implements MigrationInterface {
  name = 'Migrations1768843371594';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`category\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(150) NOT NULL, \`slug\` varchar(180) NOT NULL, \`description\` text NULL, \`parent_id\` int NULL, UNIQUE INDEX \`IDX_23c05c292c439d77b0de816b50\` (\`name\`), UNIQUE INDEX \`IDX_cb73208f151aa71cdd78f662d7\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`chapter\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`post_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`crawl_process_detail\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`crawl_process_id\` int NOT NULL, \`url\` text NOT NULL, \`title\` text NOT NULL, \`status\` enum ('created', 'running', 'done', 'failed') NOT NULL, \`error\` text NULL, \`page\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`crawl_process\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`status\` enum ('created', 'running', 'done', 'failed') NOT NULL, \`range\` json NULL, \`stats\` json NULL, \`lasted_at\` timestamp NULL, \`error\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`crawl_process_detail_post_link\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`crawl_process_detail_id\` int NOT NULL, \`post_id\` int NOT NULL, UNIQUE INDEX \`IDX_88ee971e52b13defa071cc5693\` (\`crawl_process_detail_id\`), UNIQUE INDEX \`IDX_541f7c450cc5807edcf2e0d638\` (\`post_id\`), UNIQUE INDEX \`REL_88ee971e52b13defa071cc5693\` (\`crawl_process_detail_id\`), UNIQUE INDEX \`REL_541f7c450cc5807edcf2e0d638\` (\`post_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`email\` varchar(128) NOT NULL, \`password\` varchar(100) NOT NULL, \`name\` varchar(128) NOT NULL, UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`personal_token\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`token\` text NOT NULL, \`expires_in\` varchar(128) NOT NULL, \`user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`story\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`media\` varchar(500) NOT NULL, \`rapid_gator_url\` varchar(500) NULL, \`internal_url\` varchar(500) NULL, \`chapter_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`post\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`category_id\` int NULL, \`thumbnail_url\` varchar(500) NULL, \`last_updated\` timestamp NULL, \`is_read\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tag\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_6a9775008add570dc3e5a0bab7\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`post_tag\` (\`post_id\` int NOT NULL, \`tag_id\` int NOT NULL, INDEX \`IDX_b5ec92f15aaa1e371f2662f681\` (\`post_id\`), INDEX \`IDX_d2fd5340bb68556fe93650fedc\` (\`tag_id\`), PRIMARY KEY (\`post_id\`, \`tag_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`category\` ADD CONSTRAINT \`FK_1117b4fcb3cd4abb4383e1c2743\` FOREIGN KEY (\`parent_id\`) REFERENCES \`category\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chapter\` ADD CONSTRAINT \`FK_63b207b89ef1961aeabd85cb7b4\` FOREIGN KEY (\`post_id\`) REFERENCES \`post\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`crawl_process_detail\` ADD CONSTRAINT \`FK_993998a2a0ff4f0987f0cd8bbb8\` FOREIGN KEY (\`crawl_process_id\`) REFERENCES \`crawl_process\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`crawl_process_detail_post_link\` ADD CONSTRAINT \`FK_88ee971e52b13defa071cc5693f\` FOREIGN KEY (\`crawl_process_detail_id\`) REFERENCES \`crawl_process_detail\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`crawl_process_detail_post_link\` ADD CONSTRAINT \`FK_541f7c450cc5807edcf2e0d6387\` FOREIGN KEY (\`post_id\`) REFERENCES \`post\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`personal_token\` ADD CONSTRAINT \`FK_56d921cc9e826338e2548526ea2\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`story\` ADD CONSTRAINT \`FK_f503bf57b6d0cc9199e10277cc3\` FOREIGN KEY (\`chapter_id\`) REFERENCES \`chapter\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post\` ADD CONSTRAINT \`FK_388636ba602c312da6026dc9dbc\` FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_tag\` ADD CONSTRAINT \`FK_b5ec92f15aaa1e371f2662f6812\` FOREIGN KEY (\`post_id\`) REFERENCES \`post\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_tag\` ADD CONSTRAINT \`FK_d2fd5340bb68556fe93650fedc1\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tag\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`post_tag\` DROP FOREIGN KEY \`FK_d2fd5340bb68556fe93650fedc1\``);
    await queryRunner.query(`ALTER TABLE \`post_tag\` DROP FOREIGN KEY \`FK_b5ec92f15aaa1e371f2662f6812\``);
    await queryRunner.query(`ALTER TABLE \`post\` DROP FOREIGN KEY \`FK_388636ba602c312da6026dc9dbc\``);
    await queryRunner.query(`ALTER TABLE \`story\` DROP FOREIGN KEY \`FK_f503bf57b6d0cc9199e10277cc3\``);
    await queryRunner.query(`ALTER TABLE \`personal_token\` DROP FOREIGN KEY \`FK_56d921cc9e826338e2548526ea2\``);
    await queryRunner.query(
      `ALTER TABLE \`crawl_process_detail_post_link\` DROP FOREIGN KEY \`FK_541f7c450cc5807edcf2e0d6387\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`crawl_process_detail_post_link\` DROP FOREIGN KEY \`FK_88ee971e52b13defa071cc5693f\``,
    );
    await queryRunner.query(`ALTER TABLE \`crawl_process_detail\` DROP FOREIGN KEY \`FK_993998a2a0ff4f0987f0cd8bbb8\``);
    await queryRunner.query(`ALTER TABLE \`chapter\` DROP FOREIGN KEY \`FK_63b207b89ef1961aeabd85cb7b4\``);
    await queryRunner.query(`ALTER TABLE \`category\` DROP FOREIGN KEY \`FK_1117b4fcb3cd4abb4383e1c2743\``);
    await queryRunner.query(`DROP INDEX \`IDX_d2fd5340bb68556fe93650fedc\` ON \`post_tag\``);
    await queryRunner.query(`DROP INDEX \`IDX_b5ec92f15aaa1e371f2662f681\` ON \`post_tag\``);
    await queryRunner.query(`DROP TABLE \`post_tag\``);
    await queryRunner.query(`DROP INDEX \`IDX_6a9775008add570dc3e5a0bab7\` ON \`tag\``);
    await queryRunner.query(`DROP TABLE \`tag\``);
    await queryRunner.query(`DROP TABLE \`post\``);
    await queryRunner.query(`DROP TABLE \`story\``);
    await queryRunner.query(`DROP TABLE \`personal_token\``);
    await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(`DROP INDEX \`REL_541f7c450cc5807edcf2e0d638\` ON \`crawl_process_detail_post_link\``);
    await queryRunner.query(`DROP INDEX \`REL_88ee971e52b13defa071cc5693\` ON \`crawl_process_detail_post_link\``);
    await queryRunner.query(`DROP INDEX \`IDX_541f7c450cc5807edcf2e0d638\` ON \`crawl_process_detail_post_link\``);
    await queryRunner.query(`DROP INDEX \`IDX_88ee971e52b13defa071cc5693\` ON \`crawl_process_detail_post_link\``);
    await queryRunner.query(`DROP TABLE \`crawl_process_detail_post_link\``);
    await queryRunner.query(`DROP TABLE \`crawl_process\``);
    await queryRunner.query(`DROP TABLE \`crawl_process_detail\``);
    await queryRunner.query(`DROP TABLE \`chapter\``);
    await queryRunner.query(`DROP INDEX \`IDX_cb73208f151aa71cdd78f662d7\` ON \`category\``);
    await queryRunner.query(`DROP INDEX \`IDX_23c05c292c439d77b0de816b50\` ON \`category\``);
    await queryRunner.query(`DROP TABLE \`category\``);
  }
}
