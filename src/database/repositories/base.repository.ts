import { ApiBaseGetListQueries } from 'shared/dto/request.dto';
import { Pagination } from 'shared/dto/response.dto';
import { logger } from 'shared/logger/app.logger';
import {
  DataSource,
  DeepPartial,
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectId,
  QueryRunner,
  ReplicationMode,
  Repository,
  SaveOptions,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

type ObjectLiteral = Record<string, any>;

type DeleteCriteria<T> =
  | string
  | string[]
  | number
  | number[]
  | Date
  | Date[]
  | ObjectId
  | ObjectId[]
  | FindOptionsWhere<T>;

type SoftDeleteCriteria = string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[] | any;

export class BaseRepository<T extends ObjectLiteral> {
  constructor(private readonly target: EntityTarget<T>, private readonly dataSource: DataSource) {}

  private getRepository(): Repository<T> {
    return this.dataSource.getRepository(this.target);
  }

  manager(): EntityManager {
    return this.getRepository().manager;
  }

  find(options?: FindManyOptions<T>): Promise<T[]> {
    return this.getRepository().find(options);
  }

  async paginate(paginate: ApiBaseGetListQueries, options?: FindManyOptions<T>): Promise<Pagination<T[]>> {
    const { page, perPage } = paginate;

    const result = await this.getRepository().findAndCount({
      ...options,
      take: perPage,
      skip: ((page || 0) - 1) * (perPage || 0),
    });

    return {
      items: result[0],
      pagination: {
        page: paginate?.page,
        perPage: paginate?.perPage,
        total: result[1],
      },
    };
  }

  findBy(where: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<T[]> {
    return this.getRepository().findBy(where);
  }

  findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    return this.getRepository().findAndCount(options);
  }

  findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.getRepository().findOne(options);
  }

  findOneBy(where: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<T | null> {
    return this.getRepository().findOneBy(where);
  }

  exist(options?: FindManyOptions<T>): Promise<boolean> {
    return this.getRepository().exist(options);
  }

  count(options?: FindManyOptions<T>): Promise<number> {
    return this.getRepository().count(options);
  }

  countBy(where: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<number> {
    return this.getRepository().countBy(where);
  }

  save(entity: DeepPartial<T>, options?: SaveOptions): Promise<DeepPartial<T> & T> {
    return this.getRepository().save(entity, options);
  }

  bulkSave(entities: DeepPartial<T>[], options?: SaveOptions): Promise<(DeepPartial<T> & T)[]> {
    return this.getRepository().save(entities, options);
  }

  update(
    criteria: string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[] | FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    return this.getRepository().update(criteria, partialEntity);
  }

  delete(criteria: DeleteCriteria<T>): Promise<DeleteResult> {
    return this.getRepository().delete(criteria);
  }

  softDelete(criteria: SoftDeleteCriteria): Promise<UpdateResult> {
    return this.getRepository().softDelete(criteria);
  }

  restore(criteria: SoftDeleteCriteria): Promise<UpdateResult> {
    return this.getRepository().restore(criteria);
  }

  createQueryBuilder(alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<T> {
    return this.getRepository().createQueryBuilder(alias, queryRunner);
  }

  createQueryRunner(mode?: ReplicationMode): QueryRunner {
    return this.dataSource.createQueryRunner(mode);
  }

  query(query: string, parameters?: any[]) {
    return this.getRepository().query(query, parameters);
  }

  async queryInSlave(query: string, parameters?: any[]) {
    const runner = this.createQueryRunner('slave');
    try {
      return await runner.query(query, parameters);
    } catch (e) {
      logger.error(`queryInSlave - error: ${e}`);
      throw e;
    } finally {
      await runner.release();
    }
  }

  connectWithNewRunner(mode?: ReplicationMode, retryTimes = 5): Promise<QueryRunner> {
    return this.performConnectWithNewRunner(mode, retryTimes);
  }

  private async performConnectWithNewRunner(
    mode?: ReplicationMode,
    retryTimes = 5,
    retryCount = 0,
  ): Promise<QueryRunner> {
    try {
      const runner = this.dataSource.createQueryRunner(mode);
      await runner.connect();

      return runner;
    } catch (e) {
      if (retryCount < retryTimes) {
        return this.performConnectWithNewRunner(mode, retryTimes, retryCount + 1);
      }

      throw e;
    }
  }
}
