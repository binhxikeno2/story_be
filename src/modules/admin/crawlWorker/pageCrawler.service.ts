import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CrawlProcessEntity, CrawlProcessItemEntity, CrawlProcessPageEntity } from 'database/entities';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';
import { getCrawlHeaders } from 'shared/utils/crawlHeaders.util';

@Injectable()
export class PageCrawler {
    constructor(
        private readonly crawlProcessPageRepository: CrawlProcessPageRepository,
        private readonly crawlProcessItemRepository: CrawlProcessItemRepository,
        private readonly configService: ConfigService,
    ) { }

    async run(process: CrawlProcessEntity): Promise<void> {
        // Get pending pages to crawl
        const pages = await this.crawlProcessPageRepository.findPendingPages(process.id, 5);

        if (pages.length === 0) {
            logger.info(`[PageCrawler] All pages completed for process: ${process.id}`);

            return;
        }

        for (const page of pages) {
            try {
                await this.crawlPage(page, process);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`[PageCrawler] Error crawling page ${page.id}:`, errorMessage);

                // Mark as failed but continue with other pages
                await this.crawlProcessPageRepository.update(page.id, {
                    status: CrawlStatus.FAILED,
                    lastError: errorMessage.substring(0, 1000),
                    endedAt: new Date(),
                });

                // If Cloudflare 403, log warning but continue
                if (errorMessage.includes('403') || errorMessage.includes('Cloudflare')) {
                    logger.warn(`[PageCrawler] Skipping page ${page.id} due to Cloudflare protection, continuing with other pages...`);
                }
            }
        }
    }

    private async crawlPage(page: CrawlProcessPageEntity, process: CrawlProcessEntity): Promise<void> {
        logger.info(`[PageCrawler] Crawling page ${page.pageNo} of process ${process.id}: ${page.url}`);

        // Update status
        await this.crawlProcessPageRepository.update(page.id, {
            status: CrawlStatus.RUNNING,
            startedAt: new Date(),
        });

        try {
            // Retry logic with exponential backoff
            const maxRetries = 3;
            let lastError: Error | null = null;
            let cookies = this.configService.get<string>('CRAWL_COOKIES') || '';

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    // Add random delay to avoid rate limiting
                    const delay = attempt === 1 ? 2000 + Math.random() * 3000 : 5000 * attempt;
                    if (attempt > 1) {
                        logger.info(`[PageCrawler] Retry attempt ${attempt}/${maxRetries}, waiting ${Math.round(delay)}ms...`);
                    }

                    await this.sleep(delay);

                    // Get headers from common utility
                    const headers = getCrawlHeaders({
                        cookies,
                        referer: process.category?.url3thParty || '',
                        secFetchSite: process.category?.url3thParty ? 'same-origin' : 'none',
                    });

                    // Small random delay to mimic human behavior
                    await this.sleep(Math.random() * 500);

                    const response = await fetch(page.url, {
                        headers,
                        method: 'GET',
                        redirect: 'follow',
                        credentials: 'include',
                    });

                    // Extract cookies from Set-Cookie headers for retry
                    const setCookieHeaders: string[] = [];
                    response.headers.forEach((value, key) => {
                        if (key.toLowerCase() === 'set-cookie') {
                            setCookieHeaders.push(value);
                        }
                    });

                    // Update cookies if we got new ones (especially __cf_bm)
                    if (setCookieHeaders.length > 0) {
                        setCookieHeaders.forEach((setCookie) => {
                            const cookieMatch = setCookie.match(/^([^=]+)=([^;]+)/);
                            if (cookieMatch) {
                                const cookieName = cookieMatch[1];
                                const cookieValue = cookieMatch[2];
                                if (cookieName === '__cf_bm' && !cookies.includes('__cf_bm')) {
                                    cookies = cookies ? `${cookies}; ${cookieName}=${cookieValue}` : `${cookieName}=${cookieValue}`;
                                }
                            }
                        });
                    }

                    if (!response.ok) {
                        // Check if response is zstd compressed (Cloudflare sometimes uses zstd)
                        const contentEncoding = response.headers.get('content-encoding');
                        let errorText = '';

                        try {
                            // Fetch automatically handles gzip, deflate, br but may not handle zstd
                            if (contentEncoding === 'zstd') {
                                // For zstd, we need to read as arrayBuffer and handle manually
                                // But Node.js fetch should handle it, so try text() first
                                errorText = await response.text();
                            } else {
                                errorText = await response.text();
                            }
                        } catch (textError) {
                            // Fallback: try arrayBuffer and decode
                            try {
                                const buffer = await response.arrayBuffer();
                                const decoder = new TextDecoder('utf-8');
                                errorText = decoder.decode(buffer);
                            } catch (bufferError) {
                                errorText = `Failed to decode response: ${bufferError}`;
                            }
                        }

                        if (response.status === 403) {
                            const isCloudflare = errorText.includes('Just a moment') ||
                                errorText.includes('Cloudflare') ||
                                errorText.includes('Verifying you are human') ||
                                errorText.includes('cf-browser-verification');

                            lastError = new Error(`403 Forbidden: ${isCloudflare ? 'Cloudflare/Bot protection' : 'Access denied'}`);

                            if (attempt < maxRetries) {
                                logger.warn(`[PageCrawler] 403 error on attempt ${attempt}, retrying...`);
                                await this.sleep(10000 + Math.random() * 10000);
                                continue;
                            }

                            // After all retries failed, skip this page
                            logger.error(`[PageCrawler] Cloudflare protection detected after ${maxRetries} attempts, skipping page ${page.id}`);
                            await this.crawlProcessPageRepository.update(page.id, {
                                status: CrawlStatus.FAILED,
                                lastError: lastError.message,
                                endedAt: new Date(),
                            });

                            return;
                        }

                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    // Success - fetch automatically decompresses gzip, deflate, br
                    const html = await response.text();

                    // Validate HTML content
                    if (!html || html.length === 0) {
                        throw new Error('Empty response body');
                    }

                    // Check if HTML looks valid
                    if (!html.includes('<html') && !html.includes('<!DOCTYPE') && !html.includes('<article')) {
                        const contentEncoding = response.headers.get('content-encoding');
                        logger.warn(`[PageCrawler] Response may not be valid HTML, content-encoding: ${contentEncoding || 'none'}`);
                        logger.warn(`[PageCrawler] First 500 chars: ${html.substring(0, 500)}`);
                    }

                    logger.info(`[PageCrawler] Fetched HTML successfully, length: ${html.length} characters`);
                    const baseUrl = process.category?.url3thParty || '';

                    await this.parseAndSaveUrls(html, page, process, baseUrl);

                    return;
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));

                    // Don't retry if it's 403 Cloudflare (already handled above)
                    if (lastError.message.includes('403') || lastError.message.includes('Cloudflare')) {
                        logger.error(`[PageCrawler] Cloudflare protection detected, skipping page ${page.id}`);
                        await this.crawlProcessPageRepository.update(page.id, {
                            status: CrawlStatus.FAILED,
                            lastError: lastError.message,
                            endedAt: new Date(),
                        });

                        return;
                    }

                    if (attempt < maxRetries) {
                        logger.warn(`[PageCrawler] Attempt ${attempt} failed, retrying...`);
                        continue;
                    }

                    throw lastError;
                }
            }

            // If we get here, all retries failed (non-403 error)
            throw lastError || new Error('Failed after all retries');
        } catch (error) {
            logger.error(`[PageCrawler] Error crawling page ${page.id}:`, error);
            await this.crawlProcessPageRepository.update(page.id, {
                status: CrawlStatus.FAILED,
                lastError: error instanceof Error ? error.message : String(error),
                endedAt: new Date(),
            });
            throw error;
        }
    }

    private async parseAndSaveUrls(html: string, page: CrawlProcessPageEntity, process: CrawlProcessEntity, baseUrl: string): Promise<void> {
        // Parse detail URLs from HTML - find posts in <article class="mh-loop-item">
        const detailUrls: string[] = [];

        // Find all article tags with class mh-loop-item
        const articleRegex = /<article[^>]*class=["'][^"']*mh-loop-item[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi;
        const articleMatches = html.matchAll(articleRegex);


        for (const articleMatch of articleMatches) {
            const articleContent = articleMatch[1];
            if (!articleContent) {
                continue;
            }

            // Priority 1: Find <a> tag inside <h3 class="entry-title mh-loop-title">
            let linkMatch = articleContent.match(/<h3[^>]*class=["'][^"']*entry-title[^"']*mh-loop-title[^"']*["'][^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>/i);

            // Priority 2: If not found, find <a> tag inside <figure class="mh-loop-thumb">
            if (!linkMatch) {
                linkMatch = articleContent.match(/<figure[^>]*class=["'][^"']*mh-loop-thumb[^"']*["'][^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>/i);
            }

            if (linkMatch && linkMatch[1]) {
                let href = linkMatch[1];

                // Skip download links, category links, and other non-post links
                if (href.includes('/zip/') ||
                    href.includes('/link/') ||
                    href.includes('/category/') ||
                    href.includes('/tag/') ||
                    href.startsWith('//')) {
                    continue;
                }

                // Convert relative URLs to absolute
                if (href.startsWith('/')) {
                    const baseUrlObj = new URL(baseUrl);
                    href = `${baseUrlObj.origin}${href}`;
                } else if (!href.startsWith('http')) {
                    const baseUrlObj = new URL(baseUrl);
                    href = `${baseUrlObj.origin}/${href}`;
                }

                // Only add if it's a valid HTTP URL and not already in the list
                if (href.startsWith('http') && !detailUrls.includes(href)) {
                    detailUrls.push(href);
                }
            }
        }

        logger.info(`[PageCrawler] Parsed ${detailUrls.length} detail URLs`);
        if (detailUrls.length > 0) {
            logger.info(`[PageCrawler] Sample URLs: ${detailUrls.slice(0, 5).join(', ')}`);
        }

        // Create items
        let itemsCount = 0;
        if (detailUrls.length > 0) {
            const items: Partial<CrawlProcessItemEntity>[] = detailUrls.map((url) => ({
                processPageId: page.id,
                detailUrl: url,
                status: CrawlStatus.PENDING,
            }));

            await this.crawlProcessItemRepository.bulkSave(items);
            itemsCount = items.length;
            logger.info(`[PageCrawler] Created ${itemsCount} crawl items`);
        }

        // Update page status
        await this.crawlProcessPageRepository.update(page.id, {
            status: CrawlStatus.DONE,
            foundCount: itemsCount,
            endedAt: new Date(),
        });

        logger.info(`[PageCrawler] Completed page ${page.pageNo}, found ${itemsCount} items`);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
