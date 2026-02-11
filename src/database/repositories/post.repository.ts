import { Injectable } from '@nestjs/common';
import { PostEntity } from 'database/entities';
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

  public async getPostsToSync(): Promise<PostEntity[]> {
    return this.createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.chapters', 'chapters')
      .leftJoinAndSelect('chapters.stories', 'stories')
      .where('category.threeHappyGuyCategoryId IS NOT NULL')
      .andWhere('post.threeHappyGuyPostId IS NULL')
      .andWhere("post.title IS NOT NULL AND post.title <> ''")
      .getMany()
      .then((posts) => {
        // Filter posts where all stories have internalUrl and internalUrl is not "NOT_FOUND"
        return posts.filter((post) => {
          if (!post.chapters || post.chapters.length === 0) {
            return false;
          }

          return post.chapters.every((chapter) => {
            if (!chapter.stories || chapter.stories.length === 0) {
              return false;
            }

            return chapter.stories.every(
              (story) => story.internalUrl != null && story.internalUrl !== '' && story.deletedAt == null,
            );
          });
        });
      });
  }
}
