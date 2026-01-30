import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1769756287327 implements MigrationInterface {
  name = 'Migrations1769756287327';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`category\` ADD \`3happy_guy_category_id\` int NULL`);
    await queryRunner.query(`ALTER TABLE \`post\` ADD \`3happy_guy_post_id\` int NULL`);
    await queryRunner.query(`ALTER TABLE \`tag\` ADD \`3happy_guy_tag_id\` int NULL`);
    await queryRunner.query(
      `ALTER TABLE \`crawl_process\` CHANGE \`status\` \`status\` enum ('created', 'running', 'done', 'failed', 'skip') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`crawl_process\` CHANGE \`status\` \`status\` enum ('created', 'running', 'done', 'failed') NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`tag\` DROP COLUMN \`3happy_guy_tag_id\``);
    await queryRunner.query(`ALTER TABLE \`post\` DROP COLUMN \`3happy_guy_post_id\``);
    await queryRunner.query(`ALTER TABLE \`category\` DROP COLUMN \`3happy_guy_category_id\``);
  }
}
