import { Injectable } from '@nestjs/common';
import { CrawlProcessEntity, CrawlProcessItemEntity, CrawlProcessPageEntity } from 'database/entities';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';
import { CrawlLogger } from 'shared/utils/crawlLogger.util';
import { sleep } from 'shared/utils/sleep.util';

import { HtmlParserService } from '../../htmlParser/htmlParser.service';
import { PAGE_CRAWL_DELAY_MAX, PAGE_CRAWL_DELAY_MIN, PAGES_BATCH_SIZE } from '../constants';
import { ProcessStatusService } from './processStatus.service';
import { ThirdPartyFetchService } from './thirdPartyFetch.service';

@Injectable()
export class PageCrawler {
    constructor(
        private readonly crawlProcessPageRepository: CrawlProcessPageRepository,
        private readonly crawlProcessItemRepository: CrawlProcessItemRepository,
        private readonly thirdPartyFetchService: ThirdPartyFetchService,
        private readonly htmlParserService: HtmlParserService,
        private readonly processStatusService: ProcessStatusService,
    ) { }

    async run(process: CrawlProcessEntity): Promise<void> {
        // Get pending pages to crawl
        const pages = await this.crawlProcessPageRepository.findPendingPages(process.id, PAGES_BATCH_SIZE);

        if (!pages.length) {
            return;
        }

        for (const page of pages) {
            try {
                await this.crawlPage(page, process);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                CrawlLogger.pageError(page.id, errorMessage);

                await this.processStatusService.markPageAsFailed(page, errorMessage);
            }
        }
    }

    private async crawlPage(page: CrawlProcessPageEntity, process: CrawlProcessEntity): Promise<void> {
        await this.processStatusService.markPageAsRunning(page);

        try {
            logger.info(`--- Fetching page ${page.pageNo}: ${page.url}`);

            const delay = PAGE_CRAWL_DELAY_MIN + Math.random() * PAGE_CRAWL_DELAY_MAX;

            await sleep(delay);

            const response = await this.thirdPartyFetchService.fetch(page.url, {
                referer: process.category?.url3thParty || '',
                secFetchSite: process.category?.url3thParty ? 'same-origin' : 'none',
            });

            if (!response.ok) {
                const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                await this.processStatusService.markPageAsFailed(page, errorMessage);
                throw new Error(errorMessage);
            }

            const html = await response.text();

            // Validate HTML
            if (!html || html.length === 0) {
                await this.processStatusService.markPageAsFailed(page, 'Empty response body');
                throw new Error('Empty response body');
            }

            if (!html.includes('<html') && !html.includes('<!DOCTYPE') && !html.includes('<article')) {
                await this.processStatusService.markPageAsFailed(page, 'Invalid HTML response');
                throw new Error('Invalid HTML response');
            }

            // Parse and save URLs
            const baseUrl = process.category?.url3thParty || '';
            const parseResult = this.htmlParserService.parseListPage(html, baseUrl);
            const itemsCount = await this.saveDetailUrls(parseResult.detailUrls, page);

            logger.info(`----[PageCrawler]: ${page.pageNo} page crawled: total items found: ${itemsCount}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            CrawlLogger.pageError(page.id, errorMessage);
            await this.processStatusService.markPageAsFailed(page, errorMessage);
            throw error;
        }
    }

    private async saveDetailUrls(detailUrls: string[], page: CrawlProcessPageEntity): Promise<number> {
        if (detailUrls.length === 0) {
            await this.processStatusService.markPageAsDone(page, 0);

            return 0;
        }

        const items: Partial<CrawlProcessItemEntity>[] = detailUrls.map((url) => ({
            processPageId: page.id,
            detailUrl: url,
            status: CrawlStatus.PENDING,
        }));

        await this.crawlProcessItemRepository.bulkSave(items);
        await this.processStatusService.markPageAsDone(page, items.length);

        return items.length;
    }
}
