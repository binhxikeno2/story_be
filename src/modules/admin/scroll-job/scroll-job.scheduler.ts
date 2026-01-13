import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CrawlCategoryService } from '../crawl-category/services/crawl-category.service';
import { CRAWL_CATEGORY_DETAIL_WORKER_NAME } from '../crawl-category-detail/constants/crawl-category-detail.constant';

@Injectable()
export class ScrollJobScheduler {
    constructor(
        private readonly workerManager: WorkerManager,
        private readonly crawlCategoryService: CrawlCategoryService,
    ) { }

    // @Cron(CronExpression.EVERY_DAY_AT_3AM) // 20:49:05 daily
    // async handleScrollJob(): Promise<void> {
    //     const isInProcess = await this.crawlCategoryService.isInProcessCrawl();

    //     if (isInProcess) {
    //         logger.warn('[ScrollJobScheduler] Crawl category process is already in progress, skipping...');

    //         return;
    //     }

    //     await this.workerManager.startJob(CRAWL_CATEGORY_WORKER_NAME);
    // }

    // @Cron('00 30 03 * * *') // 3:30 AM daily
    // async handleScrollJobCategoryDetail(): Promise<void> {
    //     await this.workerManager.startJob(CRAWL_CATEGORY_DETAIL_WORKER_NAME);
    // }
}

