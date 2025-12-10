import { Injectable } from '@nestjs/common';
import { UserEntity } from 'database/entities';
import { Pagination } from 'shared/dto/response.dto';
import { UserBaseRequest } from 'shared/dto/userBase.request.dto';
import { DataSource, FindOptionsOrder, FindOptionsWhere, Like } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(dataSource: DataSource) {
    super(UserEntity, dataSource);
  }

  public async findEmail(email: string): Promise<UserEntity | null> {
    return this.findOne({ where: { email }, relations: ['personalTokens'] });
  }

  public getUsers<T extends UserBaseRequest>(query: T): Promise<Pagination<UserEntity[]>> {
    const { page, perPage } = query;
    const queryCondition: FindOptionsWhere<UserEntity> = {};
    const orderCondition: FindOptionsOrder<UserEntity> = {};

    if (query?.name) {
      queryCondition.name = Like(`%${query.name}%`);
    }

    if (query?.email) {
      queryCondition.email = Like(query.email);
    }

    return this.paginate(
      { page, perPage },
      { where: queryCondition, relations: query?.relationship, order: orderCondition },
    );
  }
}
