import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1768913906925 implements MigrationInterface {
  name = 'Migrations1768913906925';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`post\` ADD \`internal_thumbnail_url\` varchar(500) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`post\` DROP COLUMN \`internal_thumbnail_url\``);
  }
}
