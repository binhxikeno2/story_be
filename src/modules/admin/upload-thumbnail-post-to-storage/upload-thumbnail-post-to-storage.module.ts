import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostRepository } from 'database/repositories/post.repository';
import { WorkerManager } from 'shared/worker/worker.manager';
import { WorkerModule } from 'shared/worker/worker.module';

import { HetznerS3Service } from '../shared/services/hetzner-s3.service';
import { PublicDownloadService } from '../shared/services/public-download.service';
import { UploadThumbnailPostToStorageController } from './upload-thumbnail-post-to-storage.controller';
import { UploadThumbnailPostToStorageService } from './upload-thumbnail-post-to-storage.service';
import { UploadThumbnailPostToStorageWorker } from './upload-thumbnail-post-to-storage.worker';

@Module({
  imports: [ConfigModule, WorkerModule],
  controllers: [UploadThumbnailPostToStorageController],
  providers: [
    UploadThumbnailPostToStorageService,
    UploadThumbnailPostToStorageWorker,
    PostRepository,
    PublicDownloadService,
    HetznerS3Service,
  ],
})
export class UploadThumbnailPostToStorageModule implements OnModuleInit {
  constructor(
    private readonly workerManager: WorkerManager,
    private readonly uploadThumbnailPostToStorageWorker: UploadThumbnailPostToStorageWorker,
  ) {}

  onModuleInit() {
    this.workerManager.register(this.uploadThumbnailPostToStorageWorker);
  }
}
