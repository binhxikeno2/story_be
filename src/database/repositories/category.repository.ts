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

        qb.leftJoinAndSelect('category.children', 'children');
        qb.loadRelationCountAndMap('category.postCount', 'category.posts');
        qb.loadRelationCountAndMap('category.unreadPostCount', 'category.posts', 'post', (qb) => {
            return qb.where('post.isRead = :isRead', { isRead: false });
        });

        // Load post count for children
        qb.loadRelationCountAndMap('children.postCount', 'children.posts');
        qb.loadRelationCountAndMap('children.unreadPostCount', 'children.posts', 'childPost', (qb) => {
            return qb.where('childPost.isRead = :isRead', { isRead: false });
        });

        // Only get root categories (no parent)
        qb.where('category.parentId IS NULL');

        if (search) {
            qb.andWhere('(LOWER(category.name) LIKE LOWER(:search) OR LOWER(category.description) LIKE LOWER(:search))', { search: `%${search}%` });
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
