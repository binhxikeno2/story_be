import { Injectable } from '@nestjs/common';
import { CategoryEntity } from 'database/entities';
import { Pagination } from 'shared/dto/response.dto';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

export type GetCategoryListQuery = {
    page?: number;
    perPage?: number;
    search?: string;
};

@Injectable()
export class CategoryRepository extends BaseRepository<CategoryEntity> {
    constructor(dataSource: DataSource) {
        super(CategoryEntity, dataSource);
    }

    public async getCategoryList(query: GetCategoryListQuery): Promise<Pagination<CategoryEntity[]>> {
        const { page, perPage, search } = query;
        const qb = this.getRepository().createQueryBuilder('category');

        qb.loadRelationCountAndMap('category.postCount', 'category.posts');
        qb.loadRelationCountAndMap('category.unreadPostCount', 'category.posts', 'post', (qb) => {
            return qb.where('post.isRead = :isRead', { isRead: false });
        });

        if (search) {
            qb.where('category.name ILIKE :search OR category.description ILIKE :search', { search: `%${search}%` });
        }

        qb.orderBy('category.createdAt', 'DESC');

        const [items, total] = await qb
            .skip(((page || 1) - 1) * (perPage || 10))
            .take(perPage || 10)
            .getManyAndCount();

        return {
            items,
            pagination: {
                page: Number(page) || 1,
                perPage: Number(perPage) || 10,
                total,
            },
        };
    }
}
