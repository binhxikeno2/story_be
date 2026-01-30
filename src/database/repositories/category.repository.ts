import { Injectable } from '@nestjs/common';
import { CategoryEntity } from 'database/entities';
import { Pagination } from 'shared/dto/response.dto';
import { DataSource, IsNull } from 'typeorm';

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

    // Chỉ count các post có title không null và không rỗng
    qb.loadRelationCountAndMap('category.postCount', 'category.posts', 'post', (qb) => {
      return qb.where("post.title IS NOT NULL AND post.title <> ''");
    });

    qb.loadRelationCountAndMap('category.unreadPostCount', 'category.posts', 'post', (qb) => {
      return qb
        .where('post.isRead = :isRead', { isRead: false })
        .andWhere("post.title IS NOT NULL AND post.title <> ''");
    });

    // Load post count for children (chỉ tính các post có title hợp lệ)
    qb.loadRelationCountAndMap('children.postCount', 'children.posts', 'childPost', (qb) => {
      return qb.where("childPost.title IS NOT NULL AND childPost.title <> ''");
    });

    qb.loadRelationCountAndMap('children.unreadPostCount', 'children.posts', 'childPost', (qb) => {
      return qb
        .where('childPost.isRead = :isRead', { isRead: false })
        .andWhere("childPost.title IS NOT NULL AND childPost.title <> ''");
    });

    // Only get root categories (no parent)
    qb.where('category.parentId IS NULL');

    if (search) {
      qb.andWhere('(LOWER(category.name) LIKE LOWER(:search) OR LOWER(category.description) LIKE LOWER(:search))', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('category.createdAt', 'DESC');

    if (!page && !perPage) {
      const [items, total] = await qb.getManyAndCount();

      return {
        items,
        pagination: {
          page: 1,
          perPage: total,
          total,
        },
      };
    }

    const currentPage = Number(page) || 1;
    const currentPerPage = Number(perPage) || 10;

    const [items, total] = await qb
      .skip((currentPage - 1) * currentPerPage)
      .take(currentPerPage)
      .getManyAndCount();

    return {
      items,
      pagination: {
        page: currentPage,
        perPage: currentPerPage,
        total,
      },
    };
  }

  public async getOrCreateCategory({ name, slug }: { name?: string; slug?: string }): Promise<Partial<CategoryEntity>> {
    let category = await this.findOneBy({ slug, name });

    if (!category) {
      category = await this.save({
        name,
        slug,
      });
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
    };
  }

  public async getCategoriesToSync(): Promise<CategoryEntity[]> {
    return this.find({
      where: {
        threeHappyGuyCategoryId: IsNull(),
      },
    });
  }
}
