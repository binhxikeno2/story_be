import { Injectable } from '@nestjs/common';
import { CategoryEntity, PostEntity } from 'database/entities';
import { Pagination } from 'shared/dto/response.dto';
import { DataSource, FindOptionsOrder, FindOptionsWhere, Like } from 'typeorm';

import { BaseRepository } from './base.repository';

export type GetPostListQuery = {
  page?: number;
  perPage?: number;
  title?: string;
  category?: string;
  isRead?: boolean;
  deleted?: boolean;
};

@Injectable()
export class PostRepository extends BaseRepository<PostEntity> {
  constructor(dataSource: DataSource) {
    super(PostEntity, dataSource);
  }

  public async getPostList(query: GetPostListQuery): Promise<Pagination<PostEntity[]>> {
    const { page, perPage, title, category, isRead } = query;
    const baseCondition: FindOptionsWhere<PostEntity> = {};
    const orderCondition: FindOptionsOrder<PostEntity> = {
      lastUpdated: 'DESC',
      createdAt: 'DESC',
    };

    if (category) {
      baseCondition.category = { slug: category };
    }

    if (isRead !== undefined) {
      baseCondition.isRead = isRead;
    }

    let whereCondition: FindOptionsWhere<PostEntity> | FindOptionsWhere<PostEntity>[];

    if (title) {
      const categoryBase = baseCondition.category as FindOptionsWhere<CategoryEntity> | undefined;

      whereCondition = [
        { ...baseCondition, title: Like(`%${title}%`) },
        { ...baseCondition, description: Like(`%${title}%`) },
        {
          ...baseCondition,
          category: categoryBase ? { ...categoryBase, name: Like(`%${title}%`) } : { name: Like(`%${title}%`) },
        },
        {
          ...baseCondition,
          category: categoryBase
            ? { ...categoryBase, description: Like(`%${title}%`) }
            : { description: Like(`%${title}%`) },
        },
      ];
    } else {
      whereCondition = baseCondition;
    }

    return this.paginate(
      { page, perPage },
      {
        where: whereCondition,
        order: orderCondition,
        relations: ['category', 'tags'],
      },
    );
  }

  public async getPostDetail(id: number): Promise<PostEntity | null> {
    return this.findOne({
      where: { id },
      relations: ['chapters', 'chapters.stories', 'category', 'tags'],
    });
  }
}
