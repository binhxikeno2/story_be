import { Injectable } from '@nestjs/common';
import { StoryEntity } from 'database/entities';
import { StoryRepository } from 'database/repositories/story.repository';
import { chunk } from 'lodash';
import { logger } from 'shared/logger/app.logger';

import { RapidGatorDownloadService } from '../../shared/services/rapid-gator-download.service';
import { ThirdPartyApiService } from '../../shared/services/third-party-api.service';

@Injectable()
export class CrawlMediaService {
    constructor(
        private readonly storyRepository: StoryRepository,
        private readonly thirdPartyApiService: ThirdPartyApiService,
        private readonly rapidGatorDownloadService: RapidGatorDownloadService,
    ) { }

    async onCrawlMedia() {
        try {
            logger.info('[CrawlMediaWorker] Starting to process crawl media');

            const stories = await this.storyRepository.findStoriesReadyCrawlMedia();

            if (!stories.length) {
                logger.info('[CrawlMediaWorker] No stories to process');

                return;
            }

            const CONCURRENT_LIMIT = 10;
            const batches = chunk(stories, CONCURRENT_LIMIT);

            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                await Promise.all(batch.map((story) => this.processStory(story)));
            }

            logger.info('[CrawlMediaWorker] Ended processing crawl media');
        } catch (error) {
            logger.error('[CrawlMediaWorker] Error in onCrawlMedia:', error);
            throw error;
        }
    }

    private async processStory(story: StoryEntity) {
        try {
            const mediaUrl = story.media;

            const { currentUrl, errorMessage } = await this.thirdPartyApiService.fetchCurrentUrl(mediaUrl);

            if (errorMessage) {
                throw new Error(errorMessage);
            }

            logger.info(`[CrawlMediaService] Story ${story.id} - Original URL: ${mediaUrl}`);

            if (!currentUrl) {
                throw new Error('No rapidGatorUrl found');
            }

            const internalUrl = await this.rapidGatorDownloadService.downloadDocument(currentUrl, '/files');

            await this.storyRepository.update(story.id, {
                rapidGatorUrl: currentUrl,
                internalUrl: internalUrl,
            });

            logger.info(`[CrawlMediaService] Updated story ${story.id} with rapidGatorUrl is ${currentUrl}`);
        } catch (error) {
            logger.error(`[CrawlMediaService] Error processing story ${story.id}:`, error);
        }
    }
}

