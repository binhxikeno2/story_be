import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CrawlProcessEntity, CrawlProcessPageEntity } from 'database/entities';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { MessageCode } from 'shared/constants/app.constant';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';
import { ApiBadRequestException } from 'shared/types';

import { CrawlProcessWorker } from '../crawlWorker/crawlWorker.worker';
import { DetailCrawler } from '../crawlWorker/detailCrawler.service';
import { PageCrawler } from '../crawlWorker/pageCrawler.service';
import { TriggerCrawlProcessReqDto } from './dto/request.dto';

@Injectable()
export class CrawlProcessService {
    constructor(
        private crawlProcessRepository: CrawlProcessRepository,
        private categoryRepository: CategoryRepository,
        private crawlProcessPageRepository: CrawlProcessPageRepository,
        private crawlProcessItemRepository: CrawlProcessItemRepository,
        @Inject(forwardRef(() => CrawlProcessWorker))
        private crawlProcessWorker: CrawlProcessWorker,
        private pageCrawler: PageCrawler,
        private detailCrawler: DetailCrawler,
    ) { }

    public async getActiveProcess(): Promise<CrawlProcessEntity | null> {
        return this.crawlProcessRepository.getActiveProcess();
    }

    public async triggerCrawlProcess(body: TriggerCrawlProcessReqDto): Promise<void> {
        const category = await this.categoryRepository.findOne({ where: { id: body.categoryId } });

        if (!category) {
            throw new ApiBadRequestException(MessageCode.categoryNotFound, 'Category not found');
        }

        const hasInProgressProcess = await this.crawlProcessRepository.checkInProgressProcess();

        // if (hasInProgressProcess) {
        //     throw new ApiBadRequestException(MessageCode.crawlInProgress, 'A crawl process is already running');
        // }

        if (body.pageFrom < 1 || body.pageTo < 1 || body.pageFrom > body.pageTo) {
            throw new ApiBadRequestException(MessageCode.invalidInput, 'Invalid page range');
        }

        const crawlProcess = await this.crawlProcessRepository.createCrawlProcess(
            category,
            body.pageFrom,
            body.pageTo,
        );

        // Create CrawlProcessPageEntity for each pageNo in range
        const baseUrl = category.url3thParty || '';
        const crawlProcessPages: Partial<CrawlProcessPageEntity>[] = [];

        for (let pageNo = body.pageFrom; pageNo <= body.pageTo; pageNo++) {
            const url = baseUrl ? `${baseUrl}?page=${pageNo}` : '';
            crawlProcessPages.push({
                processId: crawlProcess.id,
                pageNo,
                url,
            });
        }

        await this.crawlProcessPageRepository.bulkSave(crawlProcessPages);

        this.crawlProcessWorker.start(crawlProcess.id);
    }

    async process(processId: number): Promise<boolean> {
        const process = await this.crawlProcessRepository.findById(processId);

        if (!process) {
            logger.warn(`[Service] Process ${processId} not found`);

            return false;
        }

        // Phase 1: Crawl PAGE
        if (process.status === CrawlStatus.CREATED || process.status === CrawlStatus.RUNNING_PAGE) {
            return await this.processPagePhase(process);
        }

        // Phase 2: Crawl DETAIL
        // if (process.status === CrawlStatus.RUNNING_DETAIL) {
        //     return await this.processDetailPhase(process);
        // }

        // Process completed or error
        if ([CrawlStatus.CRAWLED, CrawlStatus.ERROR, CrawlStatus.CANCELLED].includes(process.status)) {
            logger.info(`[Service] Process ${processId} completed with status: ${process.status}`);

            return false;
        }

        return true;
    }

    private async processPagePhase(process: CrawlProcessEntity): Promise<boolean> {
        // Update status if CREATED
        if (process.status === CrawlStatus.CREATED) {
            await this.crawlProcessRepository.update(process.id, {
                status: CrawlStatus.RUNNING_PAGE,
            });
        }

        // Run page crawler
        await this.pageCrawler.run(process);

        // Check if there are any pending pages
        const hasPendingPages = await this.hasPendingPages(process.id);
        if (!hasPendingPages) {
            // Move to detail phase
            await this.crawlProcessRepository.update(process.id, {
                status: CrawlStatus.RUNNING_DETAIL,
            });
            logger.info(`[Service] Process ${process.id} moved to DETAIL phase`);
        }

        return true;
    }

    private async processDetailPhase(process: CrawlProcessEntity): Promise<boolean> {
        // Run detail crawler
        await this.detailCrawler.run(process);

        // Check if there are any pending items
        const hasPendingItems = await this.hasPendingItems(process.id);
        if (!hasPendingItems) {
            // Complete
            await this.crawlProcessRepository.update(process.id, {
                status: CrawlStatus.CRAWLED,
                endedProcessAt: new Date(),
            });
            logger.info(`[Service] Process ${process.id} completed`);

            return false;
        }

        return true;
    }

    async markAsError(processId: number, error: Error): Promise<void> {
        logger.error(`[Service] Marking process ${processId} as ERROR:`, error);
        await this.crawlProcessRepository.update(processId, {
            status: CrawlStatus.ERROR,
        });
    }

    private async hasPendingPages(processId: number): Promise<boolean> {
        const pages = await this.crawlProcessPageRepository.find({
            where: {
                processId,
                status: CrawlStatus.PENDING,
            },
            take: 1,
        });

        return pages.length > 0;
    }

    private async hasPendingItems(processId: number): Promise<boolean> {
        const pages = await this.crawlProcessPageRepository.find({
            where: { processId },
        });

        for (const page of pages) {
            const items = await this.crawlProcessItemRepository.find({
                where: {
                    processPageId: page.id,
                    status: CrawlStatus.PENDING,
                },
                take: 1,
            });

            if (items.length > 0) {
                return true;
            }
        }

        return false;
    }
}

