import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrawlCategoryRepository } from 'database/repositories/crawlCategory.repository';
import { CrawlCategoryDetailRepository } from 'database/repositories/crawlCategoryDetail.repository';
import { CrawlCategoryItemRepository } from 'database/repositories/crawlCategoryItem.repository';
import { WorkerManager } from 'shared/worker/worker.manager';
import { WorkerModule } from 'shared/worker/worker.module';

import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { CrawlCategoryDetailController } from './crawl-category-detail.controller';
import { CrawlCategoryDetailService } from './services/crawl-category-detail.service';
import { CrawlCategoryDetailWorker } from './workers/crawl-category-detail.worker';

@Module({
    imports: [ConfigModule, WorkerModule],
    controllers: [CrawlCategoryDetailController],
    providers: [
        CrawlCategoryRepository,
        CrawlCategoryItemRepository,
        CrawlCategoryDetailRepository,
        ThirdPartyApiService,
        CrawlCategoryDetailService,
        CrawlCategoryDetailWorker,
    ],
    exports: [CrawlCategoryDetailWorker],
})
export class CrawlCategoryDetailModule {
    constructor(
        private readonly workerManager: WorkerManager,
        private readonly crawlCategoryDetailWorker: CrawlCategoryDetailWorker,
    ) {
        this.workerManager.register(this.crawlCategoryDetailWorker);
    }
}

