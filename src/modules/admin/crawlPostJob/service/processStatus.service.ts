import { Injectable } from '@nestjs/common';
import { CrawlProcessItemEntity, CrawlProcessPageEntity } from 'database/entities';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';

@Injectable()
export class ProcessStatusService {
    constructor(
        private readonly crawlProcessPageRepository: CrawlProcessPageRepository,
        private readonly crawlProcessItemRepository: CrawlProcessItemRepository,
    ) { }

    async markPageAsRunning(page: CrawlProcessPageEntity): Promise<void> {
        await this.crawlProcessPageRepository.update(page.id, {
            status: CrawlStatus.RUNNING,
            startedAt: new Date(),
        });
    }

    async markPageAsFailed(page: CrawlProcessPageEntity, errorMessage: string): Promise<void> {
        await this.crawlProcessPageRepository.update(page.id, {
            status: CrawlStatus.FAILED,
            lastError: errorMessage.substring(0, 1000),
            endedAt: new Date(),
        });
    }

    async markPageAsDone(page: CrawlProcessPageEntity, foundCount: number): Promise<void> {
        await this.crawlProcessPageRepository.update(page.id, {
            status: CrawlStatus.DONE,
            foundCount,
            endedAt: new Date(),
        });
    }

    async markItemAsRunning(item: CrawlProcessItemEntity): Promise<void> {
        await this.crawlProcessItemRepository.update(item.id, {
            status: CrawlStatus.RUNNING,
            startedAt: new Date(),
        });
    }

    async markItemAsFailed(item: CrawlProcessItemEntity, errorMessage: string): Promise<void> {
        await this.crawlProcessItemRepository.update(item.id, {
            status: CrawlStatus.FAILED,
            lastError: errorMessage.substring(0, 1000),
            endedAt: new Date(),
        });
    }

    async markItemAsDone(item: CrawlProcessItemEntity): Promise<void> {
        await this.crawlProcessItemRepository.update(item.id, {
            status: CrawlStatus.DONE,
            endedAt: new Date(),
        });
    }
}

