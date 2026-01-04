import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StoryRepository } from 'database/repositories/story.repository';
import { WorkerManager } from 'shared/worker/worker.manager';
import { WorkerModule } from 'shared/worker/worker.module';

import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { CrawlMediaController } from './crawl-media.controller';
import { CrawlMediaService } from './services/crawl-media.service';
import { CrawlMediaWorker } from './workers/crawl-media.worker';

@Module({
    imports: [ConfigModule, WorkerModule],
    controllers: [CrawlMediaController],
    providers: [
        StoryRepository,
        ThirdPartyApiService,
        CrawlMediaService,
        CrawlMediaWorker,
    ],
    exports: [CrawlMediaWorker],
})
export class CrawlMediaModule {
    constructor(
        private readonly workerManager: WorkerManager,
        private readonly crawlMediaWorker: CrawlMediaWorker,
    ) {
        this.workerManager.register(this.crawlMediaWorker);
    }
}

