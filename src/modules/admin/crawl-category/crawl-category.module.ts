import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlCategoryRepository } from 'database/repositories/crawlCategory.repository';
import { CrawlCategoryItemRepository } from 'database/repositories/crawlCategoryItem.repository';
import { WorkerManager } from 'shared/worker/worker.manager';
import { WorkerModule } from 'shared/worker/worker.module';

import { CategoryService } from '../category/category.service';
import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { CrawlCategoryController } from './crawl-category.controller';
import { CrawlCategoryService } from './services/crawl-category.service';
import { CrawlCategoryItemService } from './services/crawl-category-item.service';
import { CrawlCategoryWorker } from './workers/crawl-category.worker';

@Module({
    imports: [ConfigModule, WorkerModule],
    controllers: [CrawlCategoryController],
    providers: [
        CategoryRepository,
        CrawlCategoryRepository,
        CrawlCategoryItemRepository,
        ThirdPartyApiService,
        CrawlCategoryService,
        CrawlCategoryItemService,
        CrawlCategoryWorker,
        CategoryService
    ],
    exports: [CrawlCategoryWorker],
})
export class CrawlCategoryModule {
    constructor(private readonly workerManager: WorkerManager, private readonly crawlCategoryWorker: CrawlCategoryWorker) {
        this.workerManager.register(this.crawlCategoryWorker);
    }
}
