import { Injectable } from '@nestjs/common';
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

    await this.crawlProcessService.onCrawlProcess();

    this.isRunningFlag = false;
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }
}
