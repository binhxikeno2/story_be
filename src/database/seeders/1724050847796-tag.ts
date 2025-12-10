import { TagEntity } from 'database/entities';
import { logger } from 'shared/logger/app.logger';
import { DataSource, DeepPartial, QueryFailedError } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class Tag1724050847796 implements Seeder {
  private createTag(): DeepPartial<TagEntity>[] {
    return [
      {
        name: 'test01',
        preview: 'test01',
      },
      {
        name: 'test02',
        preview: 'test02',
      },
      {
        name: 'test03',
        preview: 'test03',
      },
      {
        name: 'test04',
        preview: 'test04',
      },
    ];
  }

  public async run(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tags = await this.createTag();
      await queryRunner.manager.save(TagEntity, tags, { chunk: 10 });

      logger.info(`🚀 Create tags success!`);
      await queryRunner.commitTransaction();
    } catch (err) {
      if (err instanceof QueryFailedError) {
        logger.error(err.message);
      }

      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
