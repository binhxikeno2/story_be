import { Injectable } from '@nestjs/common';
import { CrawlProcessEntity } from 'database/entities';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';
import { In } from 'typeorm';

import { DetailCrawler } from './detailCrawler.service';
import { PageCrawler } from './pageCrawler.service';

@Injectable()
export class CrawlPostJobService {
    constructor(
        private readonly crawlProcessRepository: CrawlProcessRepository,
        private readonly crawlProcessPageRepository: CrawlProcessPageRepository,
        private readonly crawlProcessItemRepository: CrawlProcessItemRepository,
        private readonly pageCrawler: PageCrawler,
        private readonly detailCrawler: DetailCrawler,
    ) { }

    async process(processId: number): Promise<boolean> {
        const process = await this.crawlProcessRepository.findById(processId);

        if (!process) {
            logger.warn(`[JobService] Process ${processId} not found`);

            return false;
        }

        // Check if process exceeded limit time
        if (await this.isProcessExceededLimitTime(process)) {
            await this.cancelProcessDueToTimeout(process);

            return false;
        }

        switch (process.status) {
            case CrawlStatus.CREATED:

            case CrawlStatus.RUNNING_PAGE:
                return await this.handlePageCrawl(process);

            case CrawlStatus.RUNNING_DETAIL:
                return await this.handleDetailCrawl(process);

            case CrawlStatus.CRAWLED:

            case CrawlStatus.ERROR:

            case CrawlStatus.CANCELLED: {
                const stats = await this.getProcessStats(processId);

                logger.info(`[CrawlPost] ✅ Process ${processId} completed: ${stats.pages} pages, ${stats.items} details`);

                return false;
            }

            default: {

                return false;
            }
        }
    }

    async failedProcessCrawl(processId: number, error: Error): Promise<void> {
        logger.error(`[CrawlPost] ❌ Process ${processId} error:`, error);

        await this.crawlProcessRepository.update(processId, {
            status: CrawlStatus.ERROR,
        });
    }

    private async handlePageCrawl(process: CrawlProcessEntity): Promise<boolean> {
        if (process.status === CrawlStatus.CREATED) {
            await this.updateProcessStatus(process.id, CrawlStatus.RUNNING_PAGE);
        }

        await this.pageCrawler.run(process);

        const hasPending = await this.hasPendingPages(process.id);

        if (hasPending) {
            return true;
        }

        const stats = await this.getProcessStats(process.id);

        logger.info(`[CrawlPost] 📄 Process ${process.id}: ${stats.pages} pages crawled`);

        await this.updateProcessStatus(process.id, CrawlStatus.RUNNING_DETAIL);

        return true;
    }

    private async handleDetailCrawl(process: CrawlProcessEntity): Promise<boolean> {
        await this.detailCrawler.run(process);

        const hasPending = await this.hasPendingItems(process.id);

        if (hasPending) {
            return true;
        }

        const stats = await this.getProcessStats(process.id);

        await this.crawlProcessRepository.update(process.id, {
            status: CrawlStatus.CRAWLED,
            endedProcessAt: new Date(),
        });

        logger.info(`[CrawlPost] ✅ Process ${process.id} completed: ${stats.pages} pages, ${stats.items} details`);

        return false;
    }

    private async getProcessStats(processId: number): Promise<{ pages: number; items: number }> {
        const pages = await this.crawlProcessPageRepository.count({
            where: { processId, status: CrawlStatus.DONE },
        });

        const pageIds = await this.crawlProcessPageRepository
            .find({ where: { processId }, select: ['id'] })
            .then((list) => list.map((p) => p.id));

        const items = pageIds.length > 0
            ? await this.crawlProcessItemRepository.count({
                where: { processPageId: In(pageIds), status: CrawlStatus.DONE },
            })
            : 0;

        return { pages, items };
    }

    private async hasPendingPages(processId: number): Promise<boolean> {
        const count = await this.crawlProcessPageRepository.count({
            where: { processId, status: CrawlStatus.PENDING },
        });

        return count > 0;
    }

    private async hasPendingItems(processId: number): Promise<boolean> {
        const pageIds = await this.crawlProcessPageRepository
            .find({ where: { processId }, select: ['id'] })
            .then((list) => list.map((p) => p.id));

        if (pageIds.length === 0) {
            return false;
        }

        const count = await this.crawlProcessItemRepository.count({
            where: { processPageId: In(pageIds), status: CrawlStatus.PENDING },
        });

        return count > 0;
    }

    private async updateProcessStatus(processId: number, status: CrawlStatus): Promise<void> {
        await this.crawlProcessRepository.update(processId, { status });
    }

    private async isProcessExceededLimitTime(process: CrawlProcessEntity): Promise<boolean> {
        if (!process.limitTime || !process.startedProcessAt) {
            return false;
        }

        const now = new Date();
        const elapsedTimeSeconds = Math.floor((now.getTime() - process.startedProcessAt.getTime()) / 1000);
        const limitTimeSeconds = process.limitTime;

        return elapsedTimeSeconds > limitTimeSeconds;
    }

    private async cancelProcessDueToTimeout(process: CrawlProcessEntity): Promise<void> {
        const stats = await this.getProcessStats(process.id);

        logger.warn(`[CrawlPost] ⏱️ Process ${process.id} exceeded limit time (${process.limitTime}s), cancelling. Stats: ${stats.pages} pages, ${stats.items} details`);

        await this.crawlProcessRepository.update(process.id, {
            status: CrawlStatus.CANCELLED,
            endedProcessAt: new Date(),
        });
    }
}

