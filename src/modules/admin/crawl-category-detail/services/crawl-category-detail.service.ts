import { Injectable } from '@nestjs/common';
import { CrawlCategoryDetailEntity, CrawlCategoryItemEntity } from 'database/entities';
import { CrawlCategoryRepository } from 'database/repositories/crawlCategory.repository';
import { CrawlCategoryDetailRepository } from 'database/repositories/crawlCategoryDetail.repository';
import { CrawlCategoryItemRepository } from 'database/repositories/crawlCategoryItem.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';

import { ThirdPartyApiService } from '../../shared/services/third-party-api.service';
import { randomDelay } from '../../shared/utils/delay.util';
import { CALL_TIME_DELAY_CRAWL_CATEGORY_DETAIL_RANGE } from '../constants/call-time-delay.constant';
import { parseDetailUrlsFromHtml } from '../utils/parser-detail-urls.util';

@Injectable()
export class CrawlCategoryDetailService {
    constructor(
        private readonly crawlCategoryRepository: CrawlCategoryRepository,
        private readonly crawlCategoryItemRepository: CrawlCategoryItemRepository,
        private readonly crawlCategoryDetailRepository: CrawlCategoryDetailRepository,
        private readonly thirdPartyApiService: ThirdPartyApiService,
    ) { }

    async onCrawlCategoryDetail() {
        try {
            logger.info('[CrawlCategoryDetailWorker] Starting to process crawl category details');

            const crawlCategories = await this.crawlCategoryRepository.findCrawlCategoriesReadyCrawl();
            const failedItems: CrawlCategoryItemEntity[] = [];

            for (const [index, crawlCategory] of crawlCategories.entries()) {
                const itemsFailed = await this.processCategoryItemsOfCategory(crawlCategory.id);
                failedItems.push(...itemsFailed);

                await randomDelay({
                    min: CALL_TIME_DELAY_CRAWL_CATEGORY_DETAIL_RANGE.MIN,
                    max: CALL_TIME_DELAY_CRAWL_CATEGORY_DETAIL_RANGE.MAX,
                    skipLast: index === crawlCategories.length - 1,
                });
            }

            if (failedItems.length > 0) {
                await this.retryFailedItems(failedItems);
            }

            logger.info('[CrawlCategoryDetailWorker] Ended processing crawl category details');
        } catch (error) {
            logger.error('[CrawlCategoryDetailWorker] Error in processCrawlCategoryDetail:', error);
            throw error;
        }
    }

    private async processCategoryItemsOfCategory(crawlCategoryId: number): Promise<CrawlCategoryItemEntity[]> {
        const crawlCategoryItems = await this.crawlCategoryItemRepository.findCrawlCategoryItemsReadyCrawl(crawlCategoryId);

        await this.updateCrawlCategoryStatus({
            crawlCategoryId: crawlCategoryId,
            status: crawlCategoryItems.length > 0 ? CrawlStatus.RUNNING_DETAIL : CrawlStatus.CRAWLED
        });

        if (!crawlCategoryItems.length) {
            return [];
        }

        const failedItems: CrawlCategoryItemEntity[] = [];

        for (const item of crawlCategoryItems) {
            const success = await this.processCrawlCategoryItem(item);
            if (!success) {
                failedItems.push(item);
            }
        }

        const hasRemainingItems = await this.crawlCategoryItemRepository.hasPendingOrRunningItems(crawlCategoryId);
        if (!hasRemainingItems) {
            await this.updateCrawlCategoryStatus({
                crawlCategoryId: crawlCategoryId,
                status: CrawlStatus.CRAWLED
            });
        }

        return failedItems;
    }

    private async updateCrawlCategoryStatus({ crawlCategoryId, status }: { crawlCategoryId: number, status: CrawlStatus }): Promise<void> {
        await this.crawlCategoryRepository.save({
            id: crawlCategoryId,
            status: status
        });
    }

    private async processCrawlCategoryItem(item: CrawlCategoryItemEntity): Promise<boolean> {
        try {
            await this.updateItemStatus({
                itemId: item.id,
                status: CrawlStatus.RUNNING,
                startedAt: new Date(),
            });

            const { html, errorMessage } = await this.thirdPartyApiService.fetchHtml(item.url);

            if (errorMessage) {
                throw new Error(errorMessage);
            }

            const detailUrls = parseDetailUrlsFromHtml(html);

            if (detailUrls.length === 0) {
                throw new Error('No detail URLs found');
            }

            const crawlCategoryDetails = await this.saveCrawlCategoryDetailUrls(item.id, detailUrls);

            await this.updateItemStatus({
                itemId: item.id,
                status: CrawlStatus.DONE,
                foundCount: crawlCategoryDetails.length,
                endedAt: new Date(),
            });

            logger.info(`[CrawlCategoryDetailWorker] Processed item ${item.id}, found ${detailUrls.length} URLs`);

            return true;
        } catch (error) {
            logger.error(`[CrawlCategoryDetailWorker] Error processing item ${item.id}:`, error);
            await this.updateItemStatus({
                itemId: item.id,
                status: CrawlStatus.FAILED,
                lastError: error.message,
                endedAt: new Date(),
            });

            return false;
        }
    }

    private async retryFailedItems(failedItems: CrawlCategoryItemEntity[]): Promise<void> {
        const maxRetries = 3;
        let remainingFailed = [...failedItems];

        for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
            const stillFailed: CrawlCategoryItemEntity[] = [];

            for (const [index, item] of remainingFailed.entries()) {
                logger.info(`[CrawlCategoryDetailWorker] Retry no ${retryCount}/${maxRetries} for item ${item.id}`);
                const success = await this.retryCrawlCategoryItemFailed(item);

                if (!success) {
                    stillFailed.push(item);
                }

                await randomDelay({
                    min: CALL_TIME_DELAY_CRAWL_CATEGORY_DETAIL_RANGE.MIN,
                    max: CALL_TIME_DELAY_CRAWL_CATEGORY_DETAIL_RANGE.MAX,
                    skipLast: index === remainingFailed.length - 1,
                });
            }

            if (stillFailed.length === 0) {
                break;
            }

            remainingFailed = stillFailed;
        }
    }

    async retryCrawlCategoryItemFailed(item: CrawlCategoryItemEntity): Promise<boolean> {
        try {
            await this.updateItemStatus({
                itemId: item.id,
                status: CrawlStatus.RUNNING,
                startedAt: new Date(),
            });

            const { html, errorMessage } = await this.thirdPartyApiService.fetchHtml(item.url);

            if (errorMessage) {
                throw new Error(errorMessage);
            }

            const detailUrls = parseDetailUrlsFromHtml(html);

            if (detailUrls.length === 0) {
                throw new Error('No detail URLs found');
            }

            const crawlCategoryDetails = await this.saveCrawlCategoryDetailUrls(item.id, detailUrls);

            await this.updateItemStatus({
                itemId: item.id,
                status: CrawlStatus.DONE,
                foundCount: crawlCategoryDetails.length,
                endedAt: new Date(),
            });

            logger.info(`[CrawlCategoryDetailWorker] Successfully retry item ${item.id}, found ${detailUrls.length} URLs, saved ${crawlCategoryDetails.length} new details`);

            return true;
        } catch (error) {
            logger.error(`[CrawlCategoryDetailWorker] Error retrying item ${item.id}:`, error);
            await this.updateItemStatus({
                itemId: item.id,
                status: CrawlStatus.FAILED,
                lastError: error.message,
                endedAt: new Date(),
            });

            return false;
        }
    }

    private async updateItemStatus({
        itemId,
        status,
        startedAt,
        endedAt,
        foundCount,
        lastError,
    }: {
        itemId: number;
        status: CrawlStatus;
        startedAt?: Date;
        endedAt?: Date;
        foundCount?: number;
        lastError?: string;
    }): Promise<void> {
        await this.crawlCategoryItemRepository.save({
            id: itemId,
            status,
            startedAt,
            endedAt,
            foundCount,
            lastError,
        });
    }

    private async saveCrawlCategoryDetailUrls(crawlCategoryItemId: number, detailUrls: string[]): Promise<CrawlCategoryDetailEntity[]> {
        const existingDetails = await this.crawlCategoryDetailRepository.findByDetailUrls(detailUrls);
        const existingUrls = new Set(existingDetails.map(detail => detail.detailUrl));
        const newDetailUrls = detailUrls.filter(url => !existingUrls.has(url));

        if (!newDetailUrls.length) {
            return []
        }

        const newDetails = newDetailUrls.map(detailUrl => ({
            processPageId: crawlCategoryItemId,
            detailUrl,
            status: CrawlStatus.PENDING,
        }));

        return await this.crawlCategoryDetailRepository.bulkSave(newDetails);
    }
}

