import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrawlCategoryDetailRepository } from 'database/repositories/crawlCategoryDetail.repository';
import { PostRepository } from 'database/repositories/post.repository';
import { WorkerManager } from 'shared/worker/worker.manager';
import { WorkerModule } from 'shared/worker/worker.module';

import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { CrawlPostController } from './crawl-post.controller';
import { CrawlPostService } from './services/crawl-post.service';
import { CrawlPostWorker } from './workers/crawl-post.worker';

@Module({
    imports: [ConfigModule, WorkerModule],
    controllers: [CrawlPostController],
    providers: [
        CrawlCategoryDetailRepository,
        PostRepository,
        ThirdPartyApiService,
        CrawlPostService,
        CrawlPostWorker,
    ],
    exports: [CrawlPostWorker],
})
export class CrawlPostModule {
    constructor(
        private readonly workerManager: WorkerManager,
        private readonly crawlPostWorker: CrawlPostWorker,
    ) {
        this.workerManager.register(this.crawlPostWorker);
    }
}

