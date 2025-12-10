import { MigrationInterface, QueryRunner } from 'typeorm';

export class TagQuestion1724055824505 implements MigrationInterface {
  name = 'TagQuestion1724055824505';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the table with the proper schema
    await queryRunner.query(`
            CREATE TABLE \`tag_question\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`question_id\` int NULL,
                \`tag_id\` int NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

    // Add foreign key constraints
    await queryRunner.query(`
            ALTER TABLE \`tag_question\`
            ADD CONSTRAINT \`FK_bfd2f4266ba0205e45804c2de71\`
            FOREIGN KEY (\`question_id\`) REFERENCES \`question\`(\`id\`)
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE \`tag_question\`
            ADD CONSTRAINT \`FK_a6ad5a3bd2e3fa01b904526c39e\`
            FOREIGN KEY (\`tag_id\`) REFERENCES \`tag\`(\`id\`)
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    // Create indexes for foreign key columns
    await queryRunner.query(`CREATE INDEX \`IDX_bfd2f4266ba0205e45804c2de7\` ON \`tag_question\` (\`question_id\`)`);
    await queryRunner.query(`CREATE INDEX \`IDX_a6ad5a3bd2e3fa01b904526c39\` ON \`tag_question\` (\`tag_id\`)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE \`tag_question\` DROP FOREIGN KEY \`FK_a6ad5a3bd2e3fa01b904526c39e\``);
    await queryRunner.query(`ALTER TABLE \`tag_question\` DROP FOREIGN KEY \`FK_bfd2f4266ba0205e45804c2de71\``);

    // Drop indexes
    await queryRunner.query(`DROP INDEX \`IDX_a6ad5a3bd2e3fa01b904526c39\` ON \`tag_question\``);
    await queryRunner.query(`DROP INDEX \`IDX_bfd2f4266ba0205e45804c2de7\` ON \`tag_question\``);

    // Drop the table
    await queryRunner.query(`DROP TABLE \`tag_question\``);
  }
}
