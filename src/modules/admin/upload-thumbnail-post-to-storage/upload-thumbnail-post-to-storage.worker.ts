import { Injectable } from '@nestjs/common';
import { logger } from 'shared/logger/app.logger';
import { IWorker } from 'shared/worker/worker.interface';

import { UPLOAD_THUMBNAIL_POST_TO_STORAGE_WORKER_NAME } from './upload-thumbnail-post-to-storage.constant';
import { UploadThumbnailPostToStorageService } from './upload-thumbnail-post-to-storage.service';

@Injectable()
export class UploadThumbnailPostToStorageWorker implements IWorker {
  private isRunningFlag = false;

  constructor(private readonly uploadThumbnailPostToStorageService: UploadThumbnailPostToStorageService) {}

  getName(): string {
    return UPLOAD_THUMBNAIL_POST_TO_STORAGE_WORKER_NAME;
  }

  async start(): Promise<void> {
    this.isRunningFlag = true;
    logger.info('Upload thumbnail post to storage worker started');

    await this.uploadThumbnailPostToStorageService.uploadThumbnailPostToStorage();

    this.isRunningFlag = false;
    logger.info('Upload thumbnail post to storage worker stopped');
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }
}
