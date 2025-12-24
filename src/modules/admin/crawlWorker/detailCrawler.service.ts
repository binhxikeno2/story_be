import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChapterEntity, CrawlProcessEntity, CrawlProcessItemEntity, PostEntity, StoryEntity } from 'database/entities';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { PostRepository } from 'database/repositories/post.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';
import { getCrawlHeaders } from 'shared/utils/crawlHeaders.util';
import { CrawlLogger } from 'shared/utils/crawlLogger.util';

@Injectable()
export class DetailCrawler {
    constructor(
        private readonly crawlProcessItemRepository: CrawlProcessItemRepository,
        private readonly crawlProcessPageRepository: CrawlProcessPageRepository,
        private readonly postRepository: PostRepository,
        private readonly configService: ConfigService,
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
                await this.sleep(1000 + Math.random() * 2000);
            } catch (error) {
                errorCount++;
                const errorMessage = error instanceof Error ? error.message : String(error);
                CrawlLogger.detailError(item.id, errorMessage);
                await this.crawlProcessItemRepository.update(item.id, {
                    status: CrawlStatus.FAILED,
                    lastError: error instanceof Error ? error.message : String(error),
                    endedAt: new Date(),
                });
                // Add delay even on error to avoid hammering the server
                await this.sleep(2000 + Math.random() * 3000);
            }
        }

        // Log only if there are results or errors
        if (successCount > 0 || errorCount > 0) {
            logger.info(`[DetailCrawler] Process ${process.id}: ${successCount} details crawled${errorCount > 0 ? `, ${errorCount} errors` : ''}`);
        }
    }

    private async crawlDetail(item: CrawlProcessItemEntity, process: CrawlProcessEntity): Promise<void> {
        // Update status
        await this.crawlProcessItemRepository.update(item.id, {
            status: CrawlStatus.RUNNING,
            startedAt: new Date(),
        });

        try {
            // Retry logic with exponential backoff for rate limiting
            const maxRetries = 3;
            let lastError: Error | null = null;
            const cookies = this.configService.get<string>('CRAWL_COOKIES') || '';

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    // Add delay before request (longer for retries)
                    const delay = attempt === 1 ? 2000 + Math.random() * 3000 : 10000 * attempt + Math.random() * 5000;
                    await this.sleep(delay);

                    // Get headers from common utility
                    const headers = getCrawlHeaders({
                        cookies,
                        referer: item.detailUrl,
                        secFetchSite: 'same-origin',
                    });

                    // Small random delay to mimic human behavior
                    await this.sleep(Math.random() * 500);

                    const response = await fetch(item.detailUrl, {
                        headers,
                        method: 'GET',
                        redirect: 'follow',
                        credentials: 'include',
                    });

                    // Handle rate limiting (429) with longer delay
                    if (response.status === 429) {
                        const retryAfter = response.headers.get('Retry-After');
                        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 30000 + Math.random() * 20000;

                        if (attempt < maxRetries) {
                            logger.warn(`[DetailCrawler] ⚠️ Rate limited (429) for item ${item.id}, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
                            await this.sleep(waitTime);
                            continue;
                        }

                        throw new Error(`HTTP 429: Too Many Requests (after ${maxRetries} attempts)`);
                    }

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    // Parse HTML and extract post data
                    const html = await response.text();
                    const postData = this.parsePostData(html, process);

                    // Save post to database (with duplicate check)
                    await this.savePostData(postData, process, item.detailUrl);

                    // Update item status
                    await this.crawlProcessItemRepository.update(item.id, {
                        status: CrawlStatus.DONE,
                        endedAt: new Date(),
                    });

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
            await this.crawlProcessItemRepository.update(item.id, {
                status: CrawlStatus.FAILED,
                lastError: error instanceof Error ? error.message : String(error),
                endedAt: new Date(),
            });
            throw error;
        }
    }

    private parsePostData(html: string, process: CrawlProcessEntity): {
        thumbnailUrl?: string;
        title?: string;
        category?: string;
        categoryId?: number;
        tags?: string[];
        lastUpdated?: string;
        description?: string;
        chapters?: Array<{
            title: string;
            stories: Array<{
                title: string;
                media: string;
            }>;
        }>;
    } {
        const data: {
            thumbnailUrl?: string;
            title?: string;
            category?: string;
            categoryId?: number;
            tags?: string[];
            lastUpdated?: string;
            description?: string;
            chapters?: Array<{
                title: string;
                stories: Array<{
                    title: string;
                    media: string;
                }>;
            }>;
        } = {};

        // Extract thumbnailUrl: figure.entry-thumbnail img src
        const thumbnailMatch = html.match(/<figure[^>]*class=["'][^"']*entry-thumbnail[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*>/i);
        if (thumbnailMatch && thumbnailMatch[1]) {
            let thumbnailUrl = thumbnailMatch[1];
            // Convert relative URL to absolute if needed
            if (thumbnailUrl.startsWith('//')) {
                thumbnailUrl = `https:${thumbnailUrl}`;
            } else if (thumbnailUrl.startsWith('/')) {

                const baseUrl = process.category?.url3thParty || '';
                if (baseUrl) {
                    try {
                        const baseUrlObj = new URL(baseUrl);
                        thumbnailUrl = `${baseUrlObj.origin}${thumbnailUrl}`;
                    } catch (e) {
                        // Invalid base URL, keep as is
                    }
                }
            }

            data.thumbnailUrl = thumbnailUrl;
        }

        // Extract title: h1.entry-title
        const titleMatch = html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i);
        if (titleMatch && titleMatch[1]) {
            data.title = titleMatch[1].trim().replace(/\s+/g, ' ');
        }

        // Extract category: from process.category
        if (process.category) {
            data.category = process.category.name;
            data.categoryId = process.category.id;
        }

        // Extract tags: class mh-meta-Tag (may contain multiple tags)
        const tags: string[] = [];
        const tagSectionMatch = html.match(/<span[^>]*class=["'][^"']*mh-meta-Tag[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
        if (tagSectionMatch && tagSectionMatch[1]) {
            // Find all <a> tags within the tag section
            const tagLinks = tagSectionMatch[1].matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi);
            for (const tagLink of tagLinks) {
                if (tagLink[1]) {
                    const tagText = tagLink[1].trim();
                    if (tagText && !tags.includes(tagText)) {
                        tags.push(tagText);
                    }
                }
            }
        }

        if (tags.length > 0) {
            data.tags = tags;
        }

        // Extract lastUpdated: class mh-meta-date updated
        const dateMatch = html.match(/<span[^>]*class=["'][^"']*mh-meta-date[^"']*updated[^"']*["'][^>]*>[\s\S]*?<i[^>]*>[\s\S]*?<\/i>([\s\S]*?)<\/span>/i);
        if (dateMatch && dateMatch[1]) {
            data.lastUpdated = dateMatch[1].trim();
        }

        // Extract description: class MIntroduction

        const descMatch = html.match(/<[^>]*class=["'][^"']*MIntroduction[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i);
        if (descMatch && descMatch[1]) {
            // Clean HTML tags from description
            let description = descMatch[1].replace(/<[^>]+>/g, '').trim();
            description = description.replace(/\s+/g, ' ');
            if (description) {
                data.description = description;
            }
        }

        // Parse chapters and stories
        const chapters = this.parseChaptersAndStories(html, process);
        if (chapters.length > 0) {
            data.chapters = chapters;
        }

        return data;
    }

    private parseChaptersAndStories(html: string, process: CrawlProcessEntity): Array<{
        title: string;
        stories: Array<{
            title: string;
            media: string;
        }>;
    }> {
        const chapters: Array<{
            title: string;
            stories: Array<{
                title: string;
                media: string;
            }>;
        }> = [];

        // Find entry-content div
        const entryContentMatch = html.match(/<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (!entryContentMatch || !entryContentMatch[1]) {
            return chapters;
        }

        const entryContent = entryContentMatch[1];
        const baseUrl = process.category?.url3thParty || '';

        // Split by potential chapter markers (<p> tags that might be chapter titles)
        // We'll look for <p> tags followed by <table class="mycss-td">
        // Pattern: <p>Chapter Title</p> followed by one or more <table class="mycss-td">

        // Find all <p> tags and their positions
        const pTagRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        const pMatches: Array<{ content: string; index: number }> = [];
        let pMatch;

        while ((pMatch = pTagRegex.exec(entryContent)) !== null) {
            const content = pMatch[1].trim();
            // Skip empty paragraphs, comments, and special tags
            if (content &&
                !content.includes('<!--more-->') &&
                !content.includes('<span id="more-') &&
                !content.match(/^<[^>]+>[\s\S]*<\/[^>]+>$/)) {
                pMatches.push({
                    content: content.replace(/<[^>]+>/g, '').trim(), // Remove any inner HTML tags
                    index: pMatch.index,
                });
            }
        }

        // For each potential chapter title, check if it's followed by tables
        for (let i = 0; i < pMatches.length; i++) {
            const chapterTitle = pMatches[i].content;
            const chapterStartIndex = pMatches[i].index;

            // Find the end of this potential chapter (next <p> tag or end of content)
            const nextPIndex = i < pMatches.length - 1 ? pMatches[i + 1].index : entryContent.length;
            const chapterSection = entryContent.substring(chapterStartIndex, nextPIndex);

            // Check if this section contains tables with class "mycss-td"
            const tableRegex = /<table[^>]*class=["'][^"']*mycss-td[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi;
            const tables: string[] = [];
            let tableMatch;

            while ((tableMatch = tableRegex.exec(chapterSection)) !== null) {
                tables.push(tableMatch[1]);
            }

            // If we found tables, this is a chapter
            if (tables.length > 0) {
                const stories: Array<{ title: string; media: string }> = [];

                // Parse each table to extract story
                for (const tableContent of tables) {
                    // Extract story title (first <td> content, usually service name)
                    const firstTdMatch = tableContent.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
                    let storyTitle = '';
                    if (firstTdMatch && firstTdMatch[1]) {
                        storyTitle = firstTdMatch[1].trim().replace(/<[^>]+>/g, '').trim();
                    }

                    // Extract story media (href from <a> tag)
                    const linkMatch = tableContent.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/i);
                    if (linkMatch && linkMatch[1]) {
                        let mediaUrl = linkMatch[1];

                        // Convert relative URL to absolute
                        if (mediaUrl.startsWith('//')) {
                            mediaUrl = `https:${mediaUrl}`;
                        } else if (mediaUrl.startsWith('/')) {
                            if (baseUrl) {
                                try {
                                    const baseUrlObj = new URL(baseUrl);
                                    mediaUrl = `${baseUrlObj.origin}${mediaUrl}`;
                                } catch (e) {
                                    // Invalid base URL, keep as is
                                }
                            }
                        } else if (!mediaUrl.startsWith('http')) {
                            if (baseUrl) {
                                try {
                                    const baseUrlObj = new URL(baseUrl);
                                    mediaUrl = `${baseUrlObj.origin}/${mediaUrl}`;
                                } catch (e) {
                                    // Invalid base URL, keep as is
                                }
                            }
                        }

                        if (storyTitle && mediaUrl) {
                            stories.push({
                                title: storyTitle,
                                media: mediaUrl,
                            });
                        }
                    }
                }

                if (stories.length > 0) {
                    chapters.push({
                        title: chapterTitle,
                        stories,
                    });
                }
            }
        }

        return chapters;
    }

    private async savePostData(
        postData: {
            thumbnailUrl?: string;
            title?: string;
            categoryId?: number;
            tags?: string[];
            lastUpdated?: string;
            description?: string;
            chapters?: Array<{
                title: string;
                stories: Array<{
                    title: string;
                    media: string;
                }>;
            }>;
        },
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
            post.chapters = postData.chapters.map((chapterData) => {
                const chapter = new ChapterEntity();
                chapter.title = chapterData.title;
                chapter.stories = chapterData.stories.map((storyData) => {
                    const story = new StoryEntity();

                    story.title = storyData.title;
                    story.media = storyData.media;

                    return story;
                });

                return chapter;
            });
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
        const dateMatch = dateString.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
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

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

