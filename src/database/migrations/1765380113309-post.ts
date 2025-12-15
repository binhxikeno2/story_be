import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1765380113309 implements MigrationInterface {
    name = 'Migrations1765380113309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`post\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`tags\` text NULL, \`category\` varchar(100) NULL, \`thumbnailUrl\` varchar(500) NULL, \`lastUpdated\` timestamp NULL, \`isRead\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`chapter\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`postId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`story\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`media\` varchar(500) NOT NULL, \`chapterId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`chapter\` ADD CONSTRAINT \`FK_2f50b61b80b0905a94785a4f8bf\` FOREIGN KEY (\`postId\`) REFERENCES \`post\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`story\` ADD CONSTRAINT \`FK_b84d6c3cbb730fecc0061cf3e99\` FOREIGN KEY (\`chapterId\`) REFERENCES \`chapter\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`story\` DROP FOREIGN KEY \`FK_b84d6c3cbb730fecc0061cf3e99\``);
        await queryRunner.query(`ALTER TABLE \`chapter\` DROP FOREIGN KEY \`FK_2f50b61b80b0905a94785a4f8bf\``);
        await queryRunner.query(`DROP TABLE \`story\``);
        await queryRunner.query(`DROP TABLE \`chapter\``);
        await queryRunner.query(`DROP TABLE \`post\``);
    }

}
