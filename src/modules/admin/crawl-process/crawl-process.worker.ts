import { Injectable } from '@nestjs/common';
import { logger } from 'shared/logger/app.logger';
import { IWorker } from 'shared/worker/worker.interface';

import { CRAWL_PROCESS_WORKER_NAME } from './crawl-process.constant';
import { CrawlProcessService } from './crawl-process.service';

@Injectable()
export class CrawlProcessWorker implements IWorker {
  private isRunningFlag = false;

  constructor(private readonly crawlProcessService: CrawlProcessService) {}

  getName(): string {
    return CRAWL_PROCESS_WORKER_NAME;
  }

  async start(): Promise<void> {
    this.isRunningFlag = true;
    logger.info('Crawl process worker started');

    await this.crawlProcessService.onCrawlProcess();

    this.isRunningFlag = false;
    logger.info('Crawl process worker stopped');
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }
}
