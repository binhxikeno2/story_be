import { Injectable } from '@nestjs/common';
import { PostEntity } from 'database/entities';
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
        const queryCondition: FindOptionsWhere<PostEntity> = {};
        const orderCondition: FindOptionsOrder<PostEntity> = {
            lastUpdated: 'DESC',
            createdAt: 'DESC',
        };

        if (title) {
            queryCondition.title = Like(`%${title}%`);
        }

        if (category) {
            queryCondition.category = category;
        }

        if (isRead !== undefined) {
            queryCondition.isRead = isRead;
        }

        return this.paginate(
            { page, perPage },
            {
                where: queryCondition,
                order: orderCondition,
            },
        );
    }

    public async getPostDetail(id: number): Promise<PostEntity | null> {
        return this.findOne({
            where: { id },
            relations: ['chapters', 'chapters.stories'],
        });
    }
}
