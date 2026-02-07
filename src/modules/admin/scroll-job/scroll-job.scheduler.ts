import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { logger } from 'shared/logger/app.logger';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_PROCESS_WORKER_NAME } from '../crawl-process/crawl-process.constant';
import { SYNC_TO_WP_WORKER_NAME } from '../sync-to-wp/sync-to-wp.constant';
import { UPLOAD_STORY_MEDIA_TO_STORAGE_WORKER_NAME } from '../upload-story-media-to-storage/upload-story-media-to-storage.constant';
import { UPLOAD_THUMBNAIL_POST_TO_STORAGE_WORKER_NAME } from '../upload-thumbnail-post-to-storage/upload-thumbnail-post-to-storage.constant';

@Injectable()
export class ScrollJobScheduler {
  constructor(private readonly workerManager: WorkerManager) {}

  //trigger
  @Cron(CronExpression.EVERY_DAY_AT_7AM) // Every day at 18:50
  async handleCrawlProcessJob(): Promise<void> {
    try {
      // Check if worker is already running
      if (this.workerManager.isWorkerRunning(CRAWL_PROCESS_WORKER_NAME)) {
        logger.warn('[ScrollJobScheduler] Crawl process worker is already running, skipping...');

        return;
      }

      logger.info('[ScrollJobScheduler] Starting crawl process job via cron schedule');
      this.workerManager.startJob(CRAWL_PROCESS_WORKER_NAME).catch((error) => {
        logger.error(`[ScrollJobScheduler] Error in crawl process job: ${error}`);
      });
    } catch (error) {
      logger.error(`[ScrollJobScheduler] Error starting crawl process job: ${error}`);
    }
  }

  // @Cron(CronExpression.EVERY_8_HOURS)
  // async handleCrawlPostJob(): Promise<void> {
  //   try {
  //     if (this.workerManager.isWorkerRunning(CRAWL_POST_WORKER_NAME)) {
  //       logger.warn('[ScrollJobScheduler] Crawl post worker is already running, skipping...');

  //       return;
  //     }

  //     logger.info('[ScrollJobScheduler] Starting crawl post job via cron schedule');
  //     this.workerManager.startJob(CRAWL_POST_WORKER_NAME).catch((error) => {
  //       logger.error(`[ScrollJobScheduler] Error in crawl post job: ${error}`);
  //     });
  //   } catch (error) {
  //     logger.error(`[ScrollJobScheduler] Error starting crawl post job: ${error}`);
  //   }
  // }

  // @Cron('0 4,12,20 * * *') // Runs at 4:00, 12:00, 20:00 (every 8 hours, offset by 4 hours)
  // async handleCrawlLinkMediaJob(): Promise<void> {
  //   try {
  //     if (this.workerManager.isWorkerRunning(CRAWL_LINK_MEDIA_WORKER_NAME)) {
  //       logger.warn('[ScrollJobScheduler] Crawl link media worker is already running, skipping...');

  //       return;
  //     }

  //     logger.info('[ScrollJobScheduler] Starting crawl link media job via cron schedule');
  //     this.workerManager.startJob(CRAWL_LINK_MEDIA_WORKER_NAME).catch((error) => {
  //       logger.error(`[ScrollJobScheduler] Error in crawl link media job: ${error}`);
  //     });
  //   } catch (error) {
  //     logger.error(`[ScrollJobScheduler] Error starting crawl link media job: ${error}`);
  //   }
  // }

  @Cron(CronExpression.EVERY_4_HOURS) // Runs at 2:00, 10:00, 18:00 (every 8 hours, offset by 2 hours)
  async handleUploadThumbnailPostToStorageJob(): Promise<void> {
    try {
      if (this.workerManager.isWorkerRunning(UPLOAD_THUMBNAIL_POST_TO_STORAGE_WORKER_NAME)) {
        logger.warn('[ScrollJobScheduler] Upload thumbnail post to storage worker is already running, skipping...');

        return;
      }

      logger.info('[ScrollJobScheduler] Starting upload thumbnail post to storage job via cron schedule');
      this.workerManager.startJob(UPLOAD_THUMBNAIL_POST_TO_STORAGE_WORKER_NAME).catch((error) => {
        logger.error(`[ScrollJobScheduler] Error in upload thumbnail post to storage job: ${error}`);
      });
    } catch (error) {
      logger.error(`[ScrollJobScheduler] Error starting upload thumbnail post to storage job: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_4_HOURS) // Runs at 6:00, 14:00, 22:00 (every 8 hours, offset by 6 hours)
  async handleUploadStoryMediaToStorageJob(): Promise<void> {
    try {
      if (this.workerManager.isWorkerRunning(UPLOAD_STORY_MEDIA_TO_STORAGE_WORKER_NAME)) {
        logger.warn('[ScrollJobScheduler] Upload story media to storage worker is already running, skipping...');

        return;
      }

      logger.info('[ScrollJobScheduler] Starting upload story media to storage job via cron schedule');
      this.workerManager.startJob(UPLOAD_STORY_MEDIA_TO_STORAGE_WORKER_NAME).catch((error) => {
        logger.error(`[ScrollJobScheduler] Error in upload story media to storage job: ${error}`);
      });
    } catch (error) {
      logger.error(`[ScrollJobScheduler] Error starting upload story media to storage job: ${error}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9PM)
  async handleSyncToWpJob(): Promise<void> {
    try {
      if (this.workerManager.isWorkerRunning(SYNC_TO_WP_WORKER_NAME)) {
        logger.warn('[ScrollJobScheduler] Sync to WP worker is already running, skipping...');

        return;
      }

      logger.info('[ScrollJobScheduler] Starting sync to WP job via cron schedule');
      this.workerManager.startJob(SYNC_TO_WP_WORKER_NAME).catch((error) => {
        logger.error(`[ScrollJobScheduler] Error in sync to WP job: ${error}`);
      });
    } catch (error) {
      logger.error(`[ScrollJobScheduler] Error starting sync to WP job: ${error}`);
    }
  }
}
