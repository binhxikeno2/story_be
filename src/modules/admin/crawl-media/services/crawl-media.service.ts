import { Injectable } from '@nestjs/common';
import { StoryEntity } from 'database/entities';
import { StoryRepository } from 'database/repositories/story.repository';
import { logger } from 'shared/logger/app.logger';

import { ThirdPartyApiService } from '../../shared/services/third-party-api.service';
import { randomDelay } from '../../shared/utils/delay.util';
import { CALL_TIME_DELAY_CRAWL_MEDIA_RANGE } from '../constants/call-time-delay.constant';
import { parseRapidGatorUrlFromHtml } from '../utils/parser-media.util';

@Injectable()
export class CrawlMediaService {
    constructor(
        private readonly storyRepository: StoryRepository,
        private readonly thirdPartyApiService: ThirdPartyApiService,
    ) { }

    async onCrawlMedia() {
        try {
            logger.info('[CrawlMediaWorker] Starting to process crawl media');

            const stories = await this.storyRepository.findStoriesReadyCrawlMedia();

            if (!stories.length) {
                logger.info('[CrawlMediaWorker] No stories to process');

                return;
            }

            for (const [index, story] of stories.entries()) {
                await this.processStory(story);

                await randomDelay({
                    min: CALL_TIME_DELAY_CRAWL_MEDIA_RANGE.MIN,
                    max: CALL_TIME_DELAY_CRAWL_MEDIA_RANGE.MAX,
                    skipLast: index === stories.length - 1,
                });
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

            const { html, errorMessage } = await this.thirdPartyApiService.fetchHtml(mediaUrl);

            if (errorMessage) {
                throw new Error(errorMessage);
            }

            logger.info(`[CrawlMediaService] Story ${story.id} - Original URL: ${mediaUrl}`);

            const rapidGatorUrl = parseRapidGatorUrlFromHtml(html);

            if (!rapidGatorUrl) {
                throw new Error('No rapidGatorUrl found');
            }

            await this.storyRepository.update(story.id, {
                rapidGatorUrl,
            });

            logger.info(`[CrawlMediaService] Updated story ${story.id} with rapidGatorUrl is ${rapidGatorUrl}`);
        } catch (error) {
            logger.error(`[CrawlMediaService] Error processing story ${story.id}:`, error);
        }
    }
}

