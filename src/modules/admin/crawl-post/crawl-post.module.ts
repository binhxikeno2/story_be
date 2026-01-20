import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessDetailRepository } from 'database/repositories/crawlProcessDetail.repository';
import { PostRepository } from 'database/repositories/post.repository';
import { TagRepository } from 'database/repositories/tag.repository';
import { WorkerManager } from 'shared/worker/worker.manager';
import { WorkerModule } from 'shared/worker/worker.module';

import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { CrawlPostController } from './crawl-post.controller';
import { CrawlPostService } from './crawl-post.service';
import { CrawlPostWorker } from './crawl-post.worker';

@Module({
  imports: [ConfigModule, WorkerModule],
  controllers: [CrawlPostController],
  providers: [
    CrawlPostService,
    CrawlPostWorker,
    CrawlProcessRepository,
    CrawlProcessDetailRepository,
    CategoryRepository,
    TagRepository,
    PostRepository,
    ThirdPartyApiService,
  ],
})
export class CrawlPostModule implements OnModuleInit {
  constructor(private readonly workerManager: WorkerManager, private readonly crawlPostWorker: CrawlPostWorker) {}

  onModuleInit() {
    this.workerManager.register(this.crawlPostWorker);
  }
}
