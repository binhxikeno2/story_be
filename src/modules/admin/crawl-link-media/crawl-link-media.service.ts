import { Injectable } from '@nestjs/common';
import { StoryRepository } from 'database/repositories/story.repository';
import { logger } from 'shared/logger/app.logger';

import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { CONCURRENCY_CRAWL_LINK_MEDIA } from './crawl-link-media.constant';

@Injectable()
export class CrawlLinkMediaService {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly thirdPartyApiService: ThirdPartyApiService,
  ) {}

  async onCrawlLinkMedia(): Promise<void> {
    try {
      const stories = await this.storyRepository.getStoriesWithEmptyRapidGatorUrl();

      if (stories.length === 0) {
        return;
      }

      const batchCount = Math.ceil(stories.length / CONCURRENCY_CRAWL_LINK_MEDIA);
      const batches = Array.from({ length: batchCount }, (_, i) =>
        stories.slice(i * CONCURRENCY_CRAWL_LINK_MEDIA, (i + 1) * CONCURRENCY_CRAWL_LINK_MEDIA),
      );

      for (const batch of batches) {
        await Promise.all(
          batch.map((story) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.crawlLinkMediaForStory({ id: story.id!, media: story.media! });
          }),
        );
      }
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  async crawlLinkMediaForStory(story: { id: number; media: string }): Promise<void> {
    try {
      if (!story.media) {
        return;
      }

      const { currentUrl } = await this.thirdPartyApiService.fetchHtml(story.media);

      if (!currentUrl) {
        logger.error(`Current URL is not found for story ${story.id}`);

        return;
      }

      await this.storyRepository.update(story.id, { rapidGatorUrl: currentUrl });

      logger.info(`Crawled link media for story ${story.id}`);
    } catch (error) {
      return;
    }
  }
}
