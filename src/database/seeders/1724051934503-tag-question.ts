import { QuestionEntity, TagEntity } from 'database/entities';
import { TagQuestionEntity } from 'database/entities/tagQuestion.entity';
import { logger } from 'shared/logger/app.logger';
import { DataSource, DeepPartial, QueryFailedError } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class TagQuestion1724051934503 implements Seeder {
  private createTagQuestion(tags: TagEntity[], questions: QuestionEntity[]): DeepPartial<TagQuestionEntity>[] {
    const randomIndex = Math.floor(Math.random() * tags?.length);

    return questions?.map((item) => {
      return {
        question: item,
        tag: tags[randomIndex],
      };
    });
  }

  public async run(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tags = await queryRunner.manager.getRepository(TagEntity).find();
      const questions = await queryRunner.manager.getRepository(QuestionEntity).find();
      const tagQuestions = this.createTagQuestion(tags, questions);

      await queryRunner.manager.save(TagQuestionEntity, tagQuestions, { chunk: 10 });

      logger.info(`🚀 Create tagQuestion success!`);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);

      if (err instanceof QueryFailedError) {
        logger.error(err.message);
      }

      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
