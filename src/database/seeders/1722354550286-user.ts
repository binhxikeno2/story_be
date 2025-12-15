import { UserEntity } from 'database/entities';
import { logger } from 'shared/logger/app.logger';
import { hashBcrypt } from 'shared/utils/bcrypt';
import { DataSource, DeepPartial, QueryFailedError } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class User1722354550286 implements Seeder {
  private async createUser(): Promise<DeepPartial<UserEntity>[]> {
    return [
      {
        name: 'admin',
        email: 'admin@gmail.com',
        password: await hashBcrypt('admin123'),
      },
      {
        name: 'test01',
        email: 'test01@gmail.com',
        password: await hashBcrypt('test01123'),
      },
    ];
  }

  public async run(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const users = await this.createUser();
      await queryRunner.manager.save(UserEntity, users, { chunk: 10 });

      logger.info(`🚀 Create users success!`);
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
