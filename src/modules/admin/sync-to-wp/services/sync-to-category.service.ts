import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CategoryEntity } from 'database/entities';
import { CategoryRepository } from 'database/repositories/category.repository';
import { logger } from 'shared/logger/app.logger';

interface WordPressCategory {
  name: string;
  slug: string;
  myId: number;
  parent?: number;
}

interface WordPressCategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  existed: boolean;
  myId: number;
}

interface WordPressApiResponse {
  success: boolean;
  created: WordPressCategoryResponse[];
  count: number;
}

@Injectable()
export class SyncToCategoryService {
  constructor(private readonly categoryRepository: CategoryRepository, private readonly configService: ConfigService) {}

  async syncCategory(): Promise<void> {
    try {
      const categories = await this.categoryRepository.getCategoriesToSync();

      if (categories.length === 0) {
        logger.info('[SyncToCategoryService] No categories to sync');

        return;
      }

      const formattedCategories = this.formatCategoriesForWordPress(categories);
      const apiResponse = await this.createCategoriesInWordPress(formattedCategories);
      await this.updateCategoriesWithWordPressIds(categories, apiResponse.created);

      logger.info('[SyncToCategoryService] Sync completed successfully');
    } catch (error) {
      logger.error(`[SyncToCategoryService] Error syncing categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  private formatCategoryName(name: string): string {
    if (name.includes('/')) {
      const parts = name.split('/');

      return parts[parts.length - 1].trim();
    }

    return name;
  }

  private formatCategoriesForWordPress(categories: CategoryEntity[]): WordPressCategory[] {
    return categories.map((category) => ({
      name: this.formatCategoryName(category.name),
      slug: category.slug,
      myId: category.id,
    }));
  }

  private getApiConfig(): { apiUrl: string; apiKey: string } {
    const apiUrl = this.configService.get<string>('API_WP_URL');
    const apiKey = this.configService.get<string>('X_API_KEY_WP');

    if (!apiUrl || !apiKey) {
      throw new Error('API_WP_URL or X_API_KEY_WP is not configured');
    }

    return { apiUrl, apiKey };
  }

  private async createCategoriesInWordPress(categories: WordPressCategory[]): Promise<WordPressApiResponse> {
    const { apiUrl, apiKey } = this.getApiConfig();

    const response = await fetch(`${apiUrl}/wp-json/magazine/v1/categories/create`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categories,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[SyncToCategoryService] API returned error status ${response.status}: ${errorText}`);
      throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
    }

    const data: WordPressApiResponse = await response.json();

    if (!data.success) {
      throw new Error('WordPress API returned success: false');
    }

    logger.info(`[SyncToCategoryService] Successfully created ${data.count} categories`);

    return data;
  }

  private buildCategoryMap(
    categories: CategoryEntity[],
    createdCategories: WordPressCategoryResponse[],
  ): Map<number, number> {
    const categoryMap = new Map<number, number>();

    createdCategories.forEach((createdCategory) => {
      categoryMap.set(createdCategory.myId, createdCategory.id);
    });

    return categoryMap;
  }

  private async updateCategoriesWithWordPressIds(
    categories: CategoryEntity[],
    createdCategories: WordPressCategoryResponse[],
  ): Promise<void> {
    const categoryMap = this.buildCategoryMap(categories, createdCategories);

    for (const category of categories) {
      const wpCategoryId = categoryMap.get(category.id);
      if (wpCategoryId) {
        await this.categoryRepository.update({ id: category.id }, { threeHappyGuyCategoryId: wpCategoryId });
        logger.info(
          `[SyncToCategoryService] Updated category ${category.name} (${category.slug}) with WP ID: ${wpCategoryId}`,
        );
      }
    }
  }
}
