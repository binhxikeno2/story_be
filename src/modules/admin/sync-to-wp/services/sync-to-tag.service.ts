import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TagEntity } from 'database/entities';
import { TagRepository } from 'database/repositories/tag.repository';
import { logger } from 'shared/logger/app.logger';

interface WordPressTag {
  name: string;
  slug: string;
  myId: number;
  description?: string;
}

interface WordPressTagResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  existed: boolean;
  myId: number;
}

interface WordPressApiResponse {
  success: boolean;
  created: WordPressTagResponse[];
  count: number;
}

@Injectable()
export class SyncToTagService {
  constructor(private readonly tagRepository: TagRepository, private readonly configService: ConfigService) {}

  async syncTag(): Promise<void> {
    try {
      const tags = await this.tagRepository.getTagsToSync();

      if (tags.length === 0) {
        logger.info('[SyncToTagService] No tags to sync');

        return;
      }

      const BATCH_SIZE = 50;
      const batches = this.chunkArray(tags, BATCH_SIZE);
      const totalBatches = batches.length;

      logger.info(`[SyncToTagService] Processing ${tags.length} tags in ${totalBatches} batches`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        const formattedTags = this.formatTagsForWordPress(batch);
        const apiResponse = await this.createTagsInWordPress(formattedTags);
        await this.updateTagsWithWordPressIds(batch, apiResponse.created);
      }

      logger.info('[SyncToTagService] Sync completed successfully');
    } catch (error) {
      logger.error(`[SyncToTagService] Error syncing tags: ${error.message}`, error.stack);
      throw error;
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }

    return chunks;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private formatTagsForWordPress(tags: TagEntity[]): WordPressTag[] {
    return tags.map((tag) => ({
      name: tag.name,
      slug: this.generateSlug(tag.name),
      myId: tag.id,
      description: '',
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

  private async createTagsInWordPress(tags: WordPressTag[]): Promise<WordPressApiResponse> {
    const { apiUrl, apiKey } = this.getApiConfig();

    const response = await fetch(`${apiUrl}/wp-json/magazine/v1/tags/create`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[SyncToTagService] API returned error status ${response.status}: ${errorText}`);
      throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
    }

    const data: WordPressApiResponse = await response.json();

    if (!data.success) {
      throw new Error('WordPress API returned success: false');
    }

    logger.info(`[SyncToTagService] Successfully created ${data.count} tags`);

    return data;
  }

  private buildTagMap(tags: TagEntity[], createdTags: WordPressTagResponse[]): Map<number, number> {
    const tagMap = new Map<number, number>();

    createdTags.forEach((createdTag) => {
      tagMap.set(createdTag.myId, createdTag.id);
    });

    return tagMap;
  }

  private async updateTagsWithWordPressIds(tags: TagEntity[], createdTags: WordPressTagResponse[]): Promise<void> {
    const tagMap = this.buildTagMap(tags, createdTags);

    for (const tag of tags) {
      const wpTagId = tagMap.get(tag.id);
      if (wpTagId) {
        await this.tagRepository.update({ id: tag.id }, { threeHappyGuyTagId: wpTagId });
        logger.info(`[SyncToTagService] Updated tag ${tag.name} with WP ID: ${wpTagId}`);
      }
    }
  }
}
