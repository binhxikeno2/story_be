import { Injectable } from '@nestjs/common';
import { logger } from 'shared/logger/app.logger';
import { IWorker } from 'shared/worker/worker.interface';

import { CRAWL_LINK_MEDIA_WORKER_NAME } from './crawl-link-media.constant';
import { CrawlLinkMediaService } from './crawl-link-media.service';

@Injectable()
export class CrawlLinkMediaWorker implements IWorker {
  private isRunningFlag = false;

  constructor(private readonly crawlLinkMediaService: CrawlLinkMediaService) {}

  getName(): string {
    return CRAWL_LINK_MEDIA_WORKER_NAME;
  }

  async start(): Promise<void> {
    this.isRunningFlag = true;
    logger.info('Crawl link media worker started');

    await this.crawlLinkMediaService.onCrawlLinkMedia();

    this.isRunningFlag = false;
    logger.info('Crawl link media worker stopped');
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }
}
