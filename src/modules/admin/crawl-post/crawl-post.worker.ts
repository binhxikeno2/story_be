import { Injectable } from '@nestjs/common';
import { logger } from 'shared/logger/app.logger';
import { IWorker } from 'shared/worker/worker.interface';

import { CRAWL_POST_WORKER_NAME } from './crawl-post.constant';
import { CrawlPostService } from './crawl-post.service';

@Injectable()
export class CrawlPostWorker implements IWorker {
  private isRunningFlag = false;

  constructor(private readonly crawlPostService: CrawlPostService) {}

  getName(): string {
    return CRAWL_POST_WORKER_NAME;
  }

  async start(): Promise<void> {
    this.isRunningFlag = true;
    logger.info('Crawl post worker started');

    await this.crawlPostService.onCrawlPost();

    this.isRunningFlag = false;
    logger.info('Crawl post worker stopped');
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }
}
