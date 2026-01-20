import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { logger } from 'shared/logger/app.logger';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_PROCESS_WORKER_NAME } from '../crawl-process/crawl-process.constant';

@Injectable()
export class ScrollJobScheduler {
  constructor(private readonly workerManager: WorkerManager) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM) // 3:00 AM daily
  async handleCrawlProcessJob(): Promise<void> {
    try {
      // Check if worker is already running
      if (this.workerManager.isWorkerRunning(CRAWL_PROCESS_WORKER_NAME)) {
        logger.warn('[ScrollJobScheduler] Crawl process worker is already running, skipping...');

        return;
      }

      logger.info('[ScrollJobScheduler] Starting crawl process job via cron schedule');
      await this.workerManager.startJob(CRAWL_PROCESS_WORKER_NAME);
    } catch (error) {
      logger.error(`[ScrollJobScheduler] Error starting crawl process job: ${error}`);
    }
  }
}
