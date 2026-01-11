import { Injectable } from '@nestjs/common';
import { ChapterEntity, PostEntity, StoryEntity } from 'database/entities';
import { CrawlCategoryDetailReadyCrawl, CrawlCategoryDetailRepository } from 'database/repositories/crawlCategoryDetail.repository';
import { PostRepository } from 'database/repositories/post.repository';
import { chunk } from 'lodash';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';

import { ThirdPartyApiService } from '../../shared/services/third-party-api.service';
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

            const CONCURRENT_LIMIT = 20;
            const batches = chunk(crawlCategoryDetails, CONCURRENT_LIMIT);

            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                await Promise.all(batch.map((detail) => this.processCrawlCategoryItem(detail)));
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
            // Validate required fields
            if (!postInfo.title || postInfo.title.trim() === '') {
                throw new Error('Title is required and cannot be empty');
            }

            if (!categoryId) {
                throw new Error('CategoryId is required and cannot be empty');
            }

            if (!postInfo.lastUpdated) {
                throw new Error('LastUpdated is required and cannot be empty');
            }

            const post = new PostEntity();
            post.title = postInfo.title;
            post.description = postInfo.description;
            post.tags = postInfo.tags;
            post.thumbnailUrl = postInfo.thumbnailUrl;
            post.lastUpdated = postInfo.lastUpdated;
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

