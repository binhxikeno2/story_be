import { Injectable } from '@nestjs/common';
import { QuestionEntity } from 'database/entities';
import { QuestionReqDto } from 'modules/question/dto/request.dto';
import { Pagination } from 'shared/dto/response.dto';
import { DataSource, FindOptionsOrder, FindOptionsWhere, In, Like } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class QuestionRepository extends BaseRepository<QuestionEntity> {
  constructor(dataSource: DataSource) {
    super(QuestionEntity, dataSource);
  }

  public async getQuestion(query: QuestionReqDto): Promise<Pagination<QuestionEntity[]>> {
    const { page, perPage } = query;
    const queryCondition: FindOptionsWhere<QuestionEntity> = {};
    const orderCondition: FindOptionsOrder<QuestionEntity> = {};

    if (query?.name) {
      queryCondition.name = Like(`%${query.name}%`);
    }

    if (query?.content) {
      queryCondition.content = Like(`%${query.content}%`);
    }

    if (query?.author) {
      queryCondition.author = { name: Like(`%${query.author}%`) };
    }

    if (query?.tags) {
      const tagsSearch = query.tags.split(',').map((item) => item.trim());

      queryCondition.tags = { name: In(tagsSearch) };
    }

    if (query?.sort) {
      orderCondition[query.sort as keyof QuestionEntity] = query?.orderBy === 'ASC' ? 'ASC' : 'DESC';
    }

    return this.paginate(
      { page, perPage },
      { where: queryCondition, relations: ['author', 'tags'], order: orderCondition },
    );
  }
}
