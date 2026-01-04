import { Injectable } from '@nestjs/common';
import { ChapterEntity, PostEntity, StoryEntity } from 'database/entities';
import { CrawlCategoryDetailReadyCrawl, CrawlCategoryDetailRepository } from 'database/repositories/crawlCategoryDetail.repository';
import { PostRepository } from 'database/repositories/post.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';

import { ThirdPartyApiService } from '../../shared/services/third-party-api.service';
import { randomDelay } from '../../shared/utils/delay.util';
import { CALL_TIME_DELAY_CRAWL_POST_RANGE } from '../constants/call-time-delay.constant';
import { parsePostInfoFromHtml, PostInfo } from '../utils/parser-post-info.util';

@Injectable()
export class CrawlPostService {
    constructor(
        private readonly crawlCategoryDetailRepository: CrawlCategoryDetailRepository,
        private readonly thirdPartyApiService: ThirdPartyApiService,
        private readonly postRepository: PostRepository,
    ) { }

    async onCrawlPost() {
        try {
            logger.info('[CrawlPostWorker] Starting to process crawl post');

            const crawlCategoryDetails = await this.crawlCategoryDetailRepository.findCrawlCategoryDetailReadyCrawl();

            if (!crawlCategoryDetails.length) {
                return;
            }

            for (const [index, detail] of crawlCategoryDetails.entries()) {
                await this.processCrawlCategoryItem(detail);

                await randomDelay({
                    min: CALL_TIME_DELAY_CRAWL_POST_RANGE.MIN,
                    max: CALL_TIME_DELAY_CRAWL_POST_RANGE.MAX,
                    skipLast: index === crawlCategoryDetails.length - 1,
                });
            }

            logger.info('[CrawlPostWorker] Ended processing crawl post');
        } catch (error) {
            logger.error('[CrawlPostWorker] Error in onCrawlPost:', error);
            throw error;
        }
    }

    private async processCrawlCategoryItem(item: CrawlCategoryDetailReadyCrawl) {
        try {
            const urlDetail = item.detailUrl;

            const { html, errorMessage } = await this.thirdPartyApiService.fetchHtml(urlDetail);

            if (errorMessage) {
                throw new Error(errorMessage);
            }

            const postInfo = parsePostInfoFromHtml(html);

            if (!postInfo) {
                throw new Error('No post info found');
            }

            const savedPost = await this.savePost(postInfo, item.categoryId);

            await this.crawlCategoryDetailRepository.update(item.id, {
                status: CrawlStatus.DONE,
                postId: savedPost.id,
                endedAt: new Date(),
            });

            logger.info(`[CrawlPostService] Saved post with name: ${savedPost.title}`);
        } catch (error) {
            logger.error(`[CrawlPostWorker] Error processing item ${item.id}:`, error);

            this.crawlCategoryDetailRepository.update(item.id, {
                status: CrawlStatus.FAILED,
                lastError: error.message,
                endedAt: new Date(),
            });
        }
    }

    private async savePost(postInfo: PostInfo, categoryId?: number): Promise<PostEntity> {
        try {
            const post = new PostEntity();
            post.title = postInfo.title;
            post.description = postInfo.description;
            post.tags = postInfo.tags;
            post.thumbnailUrl = postInfo.thumbnailUrl;
            post.lastUpdated = postInfo.lastUpdated || new Date();
            post.isRead = postInfo.isRead;
            post.categoryId = categoryId;

            if (postInfo.chapters && postInfo.chapters.length > 0) {
                post.chapters = postInfo.chapters.map((chapterInfo) => {
                    const chapter = new ChapterEntity();
                    chapter.title = chapterInfo.title;

                    chapter.stories = chapterInfo.stories.map((storyInfo) => {
                        const story = new StoryEntity();
                        story.title = storyInfo.name;
                        story.media = storyInfo.media;
                        story.rapidGatorUrl = storyInfo.rapidGatorUrl || undefined;

                        return story;
                    });

                    return chapter;
                });
            }

            const savedPost = await this.postRepository.save(post);

            return savedPost;
        } catch (error) {
            logger.error('[CrawlPostService] Error saving post:', error);
            throw error;
        }
    }
}

