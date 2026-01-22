import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { logger } from 'shared/logger/app.logger';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_LINK_MEDIA_WORKER_NAME } from '../crawl-link-media/crawl-link-media.constant';
import { CRAWL_POST_WORKER_NAME } from '../crawl-post/crawl-post.constant';
import { CRAWL_PROCESS_WORKER_NAME } from '../crawl-process/crawl-process.constant';
import { UPLOAD_STORY_MEDIA_TO_STORAGE_WORKER_NAME } from '../upload-story-media-to-storage/upload-story-media-to-storage.constant';
import { UPLOAD_THUMBNAIL_POST_TO_STORAGE_WORKER_NAME } from '../upload-thumbnail-post-to-storage/upload-thumbnail-post-to-storage.constant';

@Injectable()
export class ScrollJobScheduler {
  constructor(private readonly workerManager: WorkerManager) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM) // 4:00 AM daily
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

  @Cron(CronExpression.EVERY_8_HOURS) // Runs at 0:00, 8:00, 16:00
  async handleCrawlPostJob(): Promise<void> {
    try {
      if (this.workerManager.isWorkerRunning(CRAWL_POST_WORKER_NAME)) {
        logger.warn('[ScrollJobScheduler] Crawl post worker is already running, skipping...');

        return;
      }

      logger.info('[ScrollJobScheduler] Starting crawl post job via cron schedule');
      this.workerManager.startJob(CRAWL_POST_WORKER_NAME).catch((error) => {
        logger.error(`[ScrollJobScheduler] Error in crawl post job: ${error}`);
      });
    } catch (error) {
      logger.error(`[ScrollJobScheduler] Error starting crawl post job: ${error}`);
    }
  }

  @Cron('0 4,12,20 * * *') // Runs at 4:00, 12:00, 20:00 (every 8 hours, offset by 4 hours)
  async handleCrawlLinkMediaJob(): Promise<void> {
    try {
      if (this.workerManager.isWorkerRunning(CRAWL_LINK_MEDIA_WORKER_NAME)) {
        logger.warn('[ScrollJobScheduler] Crawl link media worker is already running, skipping...');

        return;
      }

      logger.info('[ScrollJobScheduler] Starting crawl link media job via cron schedule');
      this.workerManager.startJob(CRAWL_LINK_MEDIA_WORKER_NAME).catch((error) => {
        logger.error(`[ScrollJobScheduler] Error in crawl link media job: ${error}`);
      });
    } catch (error) {
      logger.error(`[ScrollJobScheduler] Error starting crawl link media job: ${error}`);
    }
  }

  @Cron('0 2,10,18 * * *') // Runs at 2:00, 10:00, 18:00 (every 8 hours, offset by 2 hours)
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

  @Cron('0 6,14,22 * * *') // Runs at 6:00, 14:00, 22:00 (every 8 hours, offset by 6 hours)
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
}
