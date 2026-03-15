import { Injectable } from '@nestjs/common';
import { ChapterEntity, PostEntity, StoryEntity } from 'database/entities';
import { LIMIT_POST } from 'modules/admin/upload-thumbnail-post-to-storage/upload-thumbnail-post-to-storage.constant';
import { Pagination } from 'shared/dto/response.dto';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

export type GetPostListQuery = {
  page?: number;
  perPage?: number;
  title?: string;
  category?: string;
  isRead?: boolean;
  deleted?: boolean;
  syncToWP?: boolean;
};

@Injectable()
export class PostRepository extends BaseRepository<PostEntity> {
  constructor(dataSource: DataSource) {
    super(PostEntity, dataSource);
  }

  public async getPostList(query: GetPostListQuery): Promise<Pagination<PostEntity[]>> {
    const { page, perPage, title, category, isRead, syncToWP } = query;

    const pageNumber = page ?? 1;
    const perPageNumber = perPage ?? 10;

    const queryBuilder = this.createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .orderBy('post.lastUpdated', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .andWhere("post.title IS NOT NULL AND post.title <> ''");

    if (category) {
      queryBuilder.andWhere('category.slug = :category', { category });
    }

    if (isRead !== undefined) {
      queryBuilder.andWhere('post.isRead = :isRead', { isRead });
    }

    if (syncToWP !== undefined) {
      if (syncToWP === true) {
        queryBuilder.andWhere('post.threeHappyGuyPostId IS NOT NULL');
      } else {
        queryBuilder.andWhere('post.threeHappyGuyPostId IS NULL');
      }
    }

    if (title) {
      const likeTitle = `%${title}%`;
      queryBuilder.andWhere(
        '(post.title LIKE :likeTitle OR post.description LIKE :likeTitle OR category.name LIKE :likeTitle OR category.description LIKE :likeTitle)',
        { likeTitle },
      );
    }

    queryBuilder.skip((pageNumber - 1) * perPageNumber).take(perPageNumber);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      pagination: {
        page: pageNumber,
        perPage: perPageNumber,
        total,
      },
    };
  }

  public async getPostDetail(id: number): Promise<PostEntity | null> {
    return this.findOne({
      where: { id },
      relations: ['chapters', 'chapters.stories', 'category', 'tags'],
    });
  }

  public async getPostEmptyInternalThumbnailUrl(): Promise<Partial<PostEntity>[]> {
    //query build
    const queryBuilder = this.createQueryBuilder('post')
      .select('post.id', 'id')
      .addSelect('post.thumbnailUrl', 'thumbnailUrl')
      .addSelect('post.internalThumbnailUrl', 'internalThumbnailUrl')
      .where('post.internalThumbnailUrl IS NULL')
      .orderBy('post.lastUpdated', 'ASC')
      .limit(LIMIT_POST)
      .getRawMany();

    return queryBuilder;
  }

  public queryPostReadyToSync() {
    return this.createQueryBuilder('p')
      .innerJoin('chapter', 'c', 'c.post_id = p.id')
      .innerJoin('story', 's', 's.chapter_id = c.id')
      .where('p.category_id IS NOT NULL')
      .andWhere('p.title IS NOT NULL')
      .andWhere('p.internal_thumbnail_url IS NOT NULL')
      .andWhere('p.3happy_guy_post_id IS NULL')
      .andWhere('s.id IS NOT NULL')
      .andWhere((qb) => {
        const invalidStory = qb
          .subQuery()
          .select('1')
          .from(ChapterEntity, 'c')
          .innerJoin(StoryEntity, 's', 's.chapter_id = c.id')
          .where('c.post_id = p.id')
          .andWhere('(s.rapid_gator_url IS NULL OR s.internal_url IS NULL)')
          .getQuery();

        return `NOT EXISTS ${invalidStory}`;
      })
      .groupBy('post.id');
  }

  public async getPostsToSync(): Promise<PostEntity[]> {
    const query = this.queryPostReadyToSync();

    return query.getMany();
  }
}
