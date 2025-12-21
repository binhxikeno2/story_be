import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1766236062205 implements MigrationInterface {
    name = 'Migrations1766236062205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`post\` CHANGE \`category\` \`categoryId\` varchar(100) NULL`);
        await queryRunner.query(`CREATE TABLE \`category\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(150) NOT NULL, \`slug\` varchar(180) NOT NULL, \`description\` text NULL, \`thumbnailUrl\` varchar(500) NULL, UNIQUE INDEX \`IDX_23c05c292c439d77b0de816b50\` (\`name\`), UNIQUE INDEX \`IDX_cb73208f151aa71cdd78f662d7\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`post\` DROP COLUMN \`categoryId\``);
        await queryRunner.query(`ALTER TABLE \`post\` ADD \`categoryId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`post\` ADD CONSTRAINT \`FK_1077d47e0112cad3c16bbcea6cd\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`post\` DROP FOREIGN KEY \`FK_1077d47e0112cad3c16bbcea6cd\``);
        await queryRunner.query(`ALTER TABLE \`post\` DROP COLUMN \`categoryId\``);
        await queryRunner.query(`ALTER TABLE \`post\` ADD \`categoryId\` varchar(100) NULL`);
        await queryRunner.query(`DROP INDEX \`IDX_cb73208f151aa71cdd78f662d7\` ON \`category\``);
        await queryRunner.query(`DROP INDEX \`IDX_23c05c292c439d77b0de816b50\` ON \`category\``);
        await queryRunner.query(`DROP TABLE \`category\``);
        await queryRunner.query(`ALTER TABLE \`post\` CHANGE \`categoryId\` \`category\` varchar(100) NULL`);
    }

}
