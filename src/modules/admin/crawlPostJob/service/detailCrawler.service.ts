import { Injectable } from '@nestjs/common';
import { ChapterEntity, CrawlProcessEntity, CrawlProcessItemEntity, PostEntity, StoryEntity } from 'database/entities';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { PostRepository } from 'database/repositories/post.repository';
import { logger } from 'shared/logger/app.logger';
import { CrawlLogger } from 'shared/utils/crawlLogger.util';
import { sleep } from 'shared/utils/sleep.util';

import { HTML_REGEX } from '../../crawlPost/constants/regex.constant';
import { DetailPageResult, HtmlParserService } from '../../htmlParser/htmlParser.service';
import { MEDIA_PREFIX } from '../constants';
import { ProcessStatusService } from './processStatus.service';
import { ThirdPartyFetchService } from './thirdPartyFetch.service';

@Injectable()
export class DetailCrawler {
    constructor(
        private readonly crawlProcessItemRepository: CrawlProcessItemRepository,
        private readonly crawlProcessPageRepository: CrawlProcessPageRepository,
        private readonly postRepository: PostRepository,
        private readonly thirdPartyFetchService: ThirdPartyFetchService,
        private readonly htmlParserService: HtmlParserService,
        private readonly processStatusService: ProcessStatusService,
    ) { }

    async run(process: CrawlProcessEntity): Promise<void> {
        // Get all pages of the process
        const pages = await this.crawlProcessPageRepository.find({
            where: { processId: process.id },
        });

        // Get pending items from pages
        const items: CrawlProcessItemEntity[] = [];
        for (const page of pages) {
            const pageItems = await this.crawlProcessItemRepository.findPendingItems(page.id, 10);
            items.push(...pageItems);
        }

        if (items.length === 0) {
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        // Crawl each item
        for (const item of items) {
            try {
                await this.crawlDetail(item, process);
                successCount++;
                // Add delay between items to avoid rate limiting
                await sleep(1000 + Math.random() * 2000);
            } catch (error) {
                errorCount++;
                const errorMessage = error instanceof Error ? error.message : String(error);
                CrawlLogger.detailError(item.id, errorMessage);
                await this.processStatusService.markItemAsFailed(item, errorMessage);
                // Add delay even on error to avoid hammering the server
                await sleep(2000 + Math.random() * 3000);
            }
        }

        // Log only if there are results or errors
        if (successCount > 0 || errorCount > 0) {
            logger.info(`[DetailCrawler] Process ${process.id}: ${successCount} details crawled${errorCount > 0 ? `, ${errorCount} errors` : ''}`);
        }
    }

    private async crawlDetail(item: CrawlProcessItemEntity, process: CrawlProcessEntity): Promise<void> {
        await this.processStatusService.markItemAsRunning(item);

        try {
            // Retry logic with exponential backoff for rate limiting
            const maxRetries = 3;
            let lastError: Error | null = null;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    // Add delay before request (longer for retries)
                    const delay = attempt === 1 ? 2000 + Math.random() * 3000 : 10000 * attempt + Math.random() * 5000;
                    await sleep(delay);

                    const response = await this.thirdPartyFetchService.fetch(item.detailUrl, {
                        referer: item.detailUrl,
                        secFetchSite: 'same-origin',
                    });

                    // Handle rate limiting (429) with longer delay
                    if (response.status === 429) {
                        const retryAfter = response.headers.get('Retry-After');
                        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 30000 + Math.random() * 20000;

                        if (attempt < maxRetries) {
                            logger.warn(`[DetailCrawler] ⚠️ Rate limited (429) for item ${item.id}, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
                            await sleep(waitTime);
                            continue;
                        }

                        throw new Error(`HTTP 429: Too Many Requests (after ${maxRetries} attempts)`);
                    }

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const html = await response.text();
                    const baseUrl = process.category?.url3thParty || '';
                    const postData = this.htmlParserService.parseDetailPage(html, baseUrl);

                    // Save post to database (with duplicate check)
                    await this.savePostData(postData, process, item.detailUrl);

                    await this.processStatusService.markItemAsDone(item);

                    return;
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));

                    // If it's a 429 error and we have retries left, continue
                    if (lastError.message.includes('429') && attempt < maxRetries) {
                        continue;
                    }

                    // For other errors, retry if we have attempts left
                    if (attempt < maxRetries) {
                        continue;
                    }

                    throw lastError;
                }
            }

            throw lastError || new Error('Failed after all retries');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await this.processStatusService.markItemAsFailed(item, errorMessage);
            throw error;
        }
    }

    private async savePostData(
        postData: DetailPageResult,
        process: CrawlProcessEntity,
        detailUrl: string,
    ): Promise<void> {
        // Check if required fields are present
        const missingFields: string[] = [];
        if (!postData.title) {
            missingFields.push('title');
        }

        if (!postData.thumbnailUrl) {
            missingFields.push('thumbnailUrl');
        }

        if (!postData.lastUpdated) {
            missingFields.push('lastUpdated');
        }

        if (missingFields.length > 0) {
            logger.warn(`[DetailCrawler] Missing required fields: ${missingFields.join(', ')}, skipping save`);

            return;
        }


        // Parse lastUpdated string to Date
        const lastUpdatedDate = this.parseDate(postData.lastUpdated);

        if (!lastUpdatedDate) {
            logger.warn(`[DetailCrawler] Invalid lastUpdated date, skipping save. Date: ${postData.lastUpdated}`);

            return;
        }

        // At this point, we know title, thumbnailUrl are not undefined (checked above)
        const title = this.normalizeText((postData.title as string).trim());
        const thumbnailUrl = (postData.thumbnailUrl as string).trim();
        const description = (postData.description || '').trim();
        const categoryId = process.categoryId;

        // Check for duplicate: title + lastUpdated + categoryId (AND condition)
        const existingPost = await this.postRepository.findOne({
            where: {
                title,
                lastUpdated: lastUpdatedDate,
                categoryId,
            },
        });

        if (existingPost) {
            logger.info(`[DetailCrawler] Post already exists (duplicate), skipping save. Duplicate ID: ${existingPost.id}, URL: ${detailUrl}`);

            return;
        }

        // Create post entity
        const post = new PostEntity();
        post.title = title; // Already normalized
        post.description = description;
        post.thumbnailUrl = thumbnailUrl;
        post.lastUpdated = lastUpdatedDate;
        post.categoryId = categoryId; // Only get category from process, don't update
        post.tags = postData.tags || [];

        if (postData.chapters && postData.chapters.length > 0) {
            post.chapters = postData.chapters
                .map((chapterData) => {
                    // Filter stories by media prefix
                    const validStories = chapterData.stories.filter((storyData) =>
                        storyData.media && storyData.media.startsWith(MEDIA_PREFIX),
                    );

                    // Only include chapter if it has valid stories
                    if (validStories.length === 0) {
                        return null;
                    }

                    const chapter = new ChapterEntity();
                    chapter.title = chapterData.title;
                    chapter.stories = validStories.map((storyData) => {
                        const story = new StoryEntity();

                        story.title = storyData.title;
                        story.media = storyData.media;

                        return story;
                    });

                    return chapter;
                })
                .filter((chapter) => chapter !== null) as ChapterEntity[];
        }

        // Save post (cascade will save chapters and stories)
        await this.postRepository.save(post);
        logger.info(`----[DetailCrawler] Saved post: ${postData.title}`);
    }

    private normalizeText(text: string): string {
        // Normalize text to handle different encodings and whitespace
        // Remove zero-width spaces, normalize unicode, and collapse whitespace
        return text
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
            .replace(/\s+/g, ' ') // Collapse multiple whitespace to single space
            .trim();
    }

    private parseDate(dateString: string | undefined): Date | null {
        if (!dateString) {
            return null;
        }

        // Parse format: "12-23-2025" (MM-DD-YYYY)
        const dateMatch = dateString.match(HTML_REGEX.DATE_PATTERN);
        if (dateMatch) {
            const month = parseInt(dateMatch[1], 10) - 1; // Month is 0-indexed
            const day = parseInt(dateMatch[2], 10);
            const year = parseInt(dateMatch[3], 10);

            return new Date(year, month, day);
        }

        // Try parsing as ISO date
        const parsed = new Date(dateString);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }

        return null;
    }
}

