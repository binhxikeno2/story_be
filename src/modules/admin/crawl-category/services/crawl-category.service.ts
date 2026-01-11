import { Injectable } from '@nestjs/common';
import { CategoryEntity, CrawlCategoryEntity } from 'database/entities';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlCategoryRepository } from 'database/repositories/crawlCategory.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';
import { In, Not } from 'typeorm';

import { ThirdPartyApiService } from '../../shared/services/third-party-api.service';
import { randomDelay } from '../../shared/utils/delay.util';
import { parsePaginationFromHtml } from '../../shared/utils/parser-html.util';
import { CALL_TIME_DELAY_CRAWL_CATEGORY_RANGE } from '../constants/call-time-delay.constant';
import { CreateCrawlCategoryDto } from '../dto/create-crawl-category.dto';
import { CrawlCategoryItemService } from './crawl-category-item.service';

@Injectable()
export class CrawlCategoryService {
    constructor(
        private readonly crawlCategoryRepository: CrawlCategoryRepository,
        private categoryRepository: CategoryRepository,
        private readonly thirdPartyApiService: ThirdPartyApiService,
        private readonly crawlCategoryItemService: CrawlCategoryItemService
    ) { }

    async isInProcessCrawl(): Promise<boolean> {
        const inProcessCrawl = await this.crawlCategoryRepository.count({
            where: {
                status: Not(In([CrawlStatus.DONE, CrawlStatus.CANCELLED])),
            },
        });

        return inProcessCrawl > 0;
    }

    async create(data: CreateCrawlCategoryDto): Promise<CrawlCategoryEntity> {
        const crawlCategory: Partial<CrawlCategoryEntity> = {
            name: data.name,
            status: data.status,
            pageFrom: data?.pageFrom ?? null,
            pageTo: data?.pageTo ?? null,
            categoryId: data.categoryId,
            startedProcessAt: new Date(),
        };

        const saved = await this.crawlCategoryRepository.save(crawlCategory);

        const withRelation = await this.crawlCategoryRepository.findOne({
            where: { id: saved.id },
            relations: ['category'],
        });

        return withRelation ?? saved;
    }

    private async retryFailedCategories(failedCategories: CrawlCategoryEntity[]): Promise<void> {
        const maxRetries = 3;
        let remainingFailed = [...failedCategories];

        for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
            const stillFailed: CrawlCategoryEntity[] = [];

            for (const [index, category] of remainingFailed.entries()) {
                logger.info(`[CrawlCategoryWorker] Retry no ${retryCount}/${maxRetries} for ${category.name}`);
                const success = await this.retryCrawlCategoryFailed(category);

                if (!success) {
                    stillFailed.push(category);
                }

                await randomDelay({
                    min: CALL_TIME_DELAY_CRAWL_CATEGORY_RANGE.MIN,
                    max: CALL_TIME_DELAY_CRAWL_CATEGORY_RANGE.MAX,
                    skipLast: index === remainingFailed.length - 1,
                });
            }

            if (stillFailed.length === 0) {
                break;
            }

            remainingFailed = stillFailed;
        }
    }

    async retryCrawlCategoryFailed(crawlCategory: CrawlCategoryEntity): Promise<boolean> {
        const url3thParty = crawlCategory.category?.url3thParty;

        if (!url3thParty) {
            return false;
        }

        const { html } = await this.thirdPartyApiService.fetchHtml(url3thParty);
        const pagination = parsePaginationFromHtml(html);

        if (!pagination) {
            logger.warn(`[CrawlCategoryWorker] Could not parse pagination for category ${crawlCategory.id} with html: ${html}`);
            logger.error(`[CreateCrawlCategory] Could not parse pagination for category ${crawlCategory.name}`);

            return false;
        }

        await this.crawlCategoryRepository.save({
            id: crawlCategory.id,
            pageFrom: pagination.pageFrom,
            pageTo: pagination.pageTo,
            status: CrawlStatus.CREATED,
        });

        const items = await this.crawlCategoryItemService.createItems(
            crawlCategory.id,
            url3thParty,
            pagination.pageFrom,
            pagination.pageTo,
        );

        logger.info(`[CreateCrawlCategory] Successfully create crawl category ${crawlCategory.name} with ${items.length} items`);

        return true;
    }

    private calculatePaginationWithRecent(
        pagination: { pageFrom: number; pageTo: number } | null,
        recentCrawlCategory: CrawlCategoryEntity | null
    ) {
        if (!pagination?.pageFrom && !pagination?.pageTo) {
            return { pageFrom: null, pageTo: null, status: CrawlStatus.ERROR, shouldCreateItems: false };
        }

        if (!recentCrawlCategory) {
            return { pageFrom: pagination.pageFrom, pageTo: pagination.pageTo, status: CrawlStatus.CREATED, shouldCreateItems: true };
        }

        const pageFromRecent = recentCrawlCategory.pageFrom ?? 0;
        const pageToRecent = recentCrawlCategory.pageTo ?? 0;
        const hasNoNewPages = pagination.pageFrom === pageFromRecent && pagination.pageTo === pageToRecent;

        if (hasNoNewPages) {
            return null;
        }

        return {
            pageFrom: (pagination.pageFrom + 1) - pageFromRecent,
            pageTo: (pagination.pageTo + 1) - pageToRecent,
            status: CrawlStatus.CREATED,
            shouldCreateItems: true,
        };
    }

    private async createCrawlItems(
        crawlCategory: CrawlCategoryEntity,
        url3thParty: string,
        pageFrom: number | null,
        pageTo: number | null,
        shouldCreateItems: boolean
    ) {
        if (!shouldCreateItems) {
            return;
        }

        if (pageFrom === null || pageFrom === undefined || pageTo === null || pageTo === undefined) {
            return;
        }

        const items = await this.crawlCategoryItemService.createItems(
            crawlCategory.id,
            url3thParty,
            pageFrom,
            pageTo,
        );

        return items;
    }

    async createCrawlCategory(category: CategoryEntity) {
        if (!category.url3thParty) {
            return;
        }

        const recentCrawlCategory = await this.crawlCategoryRepository.findLastedCrawlCategory(category.id);
        const { html, errorMessage } = await this.thirdPartyApiService.fetchHtml(category.url3thParty);


        if (errorMessage) {
            return null;
        }

        const pagination = parsePaginationFromHtml(html);

        const paginate = this.calculatePaginationWithRecent(pagination, recentCrawlCategory);

        if (!paginate) {
            return null;
        }

        const { pageFrom: finalPageFrom, pageTo: finalPageTo, status, shouldCreateItems } = paginate;

        const crawlCategory = await this.create({
            name: category.name,
            status,
            pageFrom: finalPageFrom ?? undefined,
            pageTo: finalPageTo ?? undefined,
            categoryId: category.id,
        });

        const items = await this.createCrawlItems(crawlCategory, category.url3thParty, finalPageFrom, finalPageTo, shouldCreateItems);

        if (crawlCategory.status === CrawlStatus.ERROR) {
            logger.error(`[CreateCrawlCategory] Create crawl category ${crawlCategory.name} with ${items?.length ?? 0} items`);
        } else {
            logger.info(`[CreateCrawlCategory] Successfully create crawl category ${crawlCategory.name} with ${items?.length ?? 0} items`);

        }


        return crawlCategory;
    }

    async onCreateCrawlCategories() {
        try {
            logger.info('[CrawlCategoryWorker] Starting to process all categories');
            const categories = await this.categoryRepository.find();
            const crawlCategoriesFailed: CrawlCategoryEntity[] = []

            for (const [index, category] of categories.entries()) {
                const crawlCategory = await this.createCrawlCategory(category);

                if (crawlCategory?.status === CrawlStatus.ERROR) {
                    crawlCategoriesFailed.push(crawlCategory);
                }

                await randomDelay({
                    min: CALL_TIME_DELAY_CRAWL_CATEGORY_RANGE.MIN,
                    max: CALL_TIME_DELAY_CRAWL_CATEGORY_RANGE.MAX,
                    skipLast: index === categories.length - 1,
                });
            }

            if (crawlCategoriesFailed.length > 0) {
                await this.retryFailedCategories(crawlCategoriesFailed);
            }

            logger.info('[CrawlCategoryWorker] Ended to process all categories');
        } catch (error) {
            logger.error('[CrawlCategoryWorker] Error in onCrawlCategories:', error);
            throw error;
        }
    }
}
