import { QuestionEntity, UserEntity } from 'database/entities';
import { logger } from 'shared/logger/app.logger';
import { DataSource, DeepPartial, QueryFailedError } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class Question1724049920098 implements Seeder {
  private createQuestion(user: UserEntity): DeepPartial<QuestionEntity>[] {
    return [
      {
        name: 'test01',
        content: 'test01',
        thumbnailUrl: 'test01',
        author: user,
      },
      {
        name: 'test02',
        content: 'test02',
        thumbnailUrl: 'test02',
        author: user,
      },
      {
        name: 'test03',
        content: 'test03',
        thumbnailUrl: 'test03',
        author: user,
      },
      {
        name: 'test04',
        content: 'test04',
        thumbnailUrl: 'test04',
        author: user,
      },
    ];
  }

  public async run(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepository = queryRunner.manager.getRepository(UserEntity);
      const user = await userRepository.createQueryBuilder().limit(1).getOne();

      if (!user) throw Error('Author notfound');

      const questions = await this.createQuestion(user);
      await queryRunner.manager.save(QuestionEntity, questions, { chunk: 10 });

      logger.info(`🚀 Create questions success!`);
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
