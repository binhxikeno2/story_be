import { Injectable } from '@nestjs/common';
import { logger } from 'shared/logger/app.logger';
import { IWorker } from 'shared/worker/worker.interface';

import { SyncToWpService } from './services/sync-to-wp.service';
import { SYNC_TO_WP_WORKER_NAME } from './sync-to-wp.constant';

@Injectable()
export class SyncToWpWorker implements IWorker {
  private isRunningFlag = false;

  constructor(private readonly syncToWpService: SyncToWpService) {}

  getName(): string {
    return SYNC_TO_WP_WORKER_NAME;
  }

  async start(): Promise<void> {
    this.isRunningFlag = true;
    logger.info('Sync to WP worker started');

    await this.syncToWpService.onSyncToWp();

    this.isRunningFlag = false;
    logger.info('Sync to WP worker stopped');
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }
}
