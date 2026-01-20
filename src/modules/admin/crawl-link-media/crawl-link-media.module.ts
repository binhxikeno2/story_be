import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StoryRepository } from 'database/repositories/story.repository';
import { WorkerManager } from 'shared/worker/worker.manager';
import { WorkerModule } from 'shared/worker/worker.module';

import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { CrawlLinkMediaController } from './crawl-link-media.controller';
import { CrawlLinkMediaService } from './crawl-link-media.service';
import { CrawlLinkMediaWorker } from './crawl-link-media.worker';

@Module({
  imports: [ConfigModule, WorkerModule],
  controllers: [CrawlLinkMediaController],
  providers: [CrawlLinkMediaService, CrawlLinkMediaWorker, StoryRepository, ThirdPartyApiService],
})
export class CrawlLinkMediaModule implements OnModuleInit {
  constructor(
    private readonly workerManager: WorkerManager,
    private readonly crawlLinkMediaWorker: CrawlLinkMediaWorker,
  ) {}

  onModuleInit() {
    this.workerManager.register(this.crawlLinkMediaWorker);
  }
}
