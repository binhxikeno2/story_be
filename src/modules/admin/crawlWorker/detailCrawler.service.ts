import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CrawlProcessEntity, CrawlProcessItemEntity } from 'database/entities';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';
import { getCrawlHeaders } from 'shared/utils/crawlHeaders.util';

@Injectable()
export class DetailCrawler {
    constructor(
        private readonly crawlProcessItemRepository: CrawlProcessItemRepository,
        private readonly crawlProcessPageRepository: CrawlProcessPageRepository,
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
            logger.info(`[DetailCrawler] No items to crawl for process: ${process.id}`);

            return;
        }

        // Crawl each item
        for (const item of items) {
            try {
                await this.crawlDetail(item);
            } catch (error) {
                logger.error(`[DetailCrawler] Error crawling item ${item.id}:`, error);
                await this.crawlProcessItemRepository.update(item.id, {
                    status: CrawlStatus.FAILED,
                    lastError: error instanceof Error ? error.message : String(error),
                    endedAt: new Date(),
                });
            }
        }
    }

    private async crawlDetail(item: CrawlProcessItemEntity): Promise<void> {
        logger.info(`[DetailCrawler] Crawling detail: ${item.detailUrl}`);

        // Update status
        await this.crawlProcessItemRepository.update(item.id, {
            status: CrawlStatus.RUNNING,
            startedAt: new Date(),
        });

        try {
            // Get cookies from environment variable
            const cookies = this.configService.get<string>('CRAWL_COOKIES') || '';

            // Get headers from common utility
            const headers = getCrawlHeaders({
                cookies,
                referer: item.detailUrl,
                secFetchSite: 'same-origin',
            });

            // Fetch HTML from item.detailUrl
            const response = await fetch(item.detailUrl, {
                headers,
                method: 'GET',
                redirect: 'follow',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();
            logger.info(`[DetailCrawler] Fetched HTML successfully, length: ${html.length} characters`);

            // TODO: Parse Post/Chapter/Story data from HTML
            // const $ = cheerio.load(html);
            // const postData = {
            //     title: $('h1').text(),
            //     content: $('.content').html(),
            //     // ...
            // };
            // await this.postRepository.upsert(postData);

            // Update item status
            await this.crawlProcessItemRepository.update(item.id, {
                status: CrawlStatus.DONE,
                endedAt: new Date(),
            });

            logger.info(`[DetailCrawler] Crawled detail: ${item.detailUrl}`);
        } catch (error) {
            await this.crawlProcessItemRepository.update(item.id, {
                status: CrawlStatus.FAILED,
                lastError: error instanceof Error ? error.message : String(error),
                endedAt: new Date(),
            });
            throw error;
        }
    }
}

