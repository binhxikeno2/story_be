import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessDetailRepository } from 'database/repositories/crawlProcessDetail.repository';
import { WorkerManager } from 'shared/worker/worker.manager';
import { WorkerModule } from 'shared/worker/worker.module';

import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { CrawlProcessController } from './crawl-process.controller';
import { CrawlProcessService } from './crawl-process.service';
import { CrawlProcessWorker } from './crawl-process.worker';

@Module({
  imports: [ConfigModule, WorkerModule],
  controllers: [CrawlProcessController],
  providers: [
    CrawlProcessService,
    CrawlProcessWorker,
    CrawlProcessRepository,
    CrawlProcessDetailRepository,
    ThirdPartyApiService,
  ],
})
export class CrawlProcessModule implements OnModuleInit {
  constructor(private readonly workerManager: WorkerManager, private readonly crawlProcessWorker: CrawlProcessWorker) {}

  onModuleInit() {
    this.workerManager.register(this.crawlProcessWorker);
  }
}
