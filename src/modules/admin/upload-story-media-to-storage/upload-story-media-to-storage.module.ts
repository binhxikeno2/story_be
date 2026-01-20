import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostRepository } from 'database/repositories/post.repository';
import { StoryRepository } from 'database/repositories/story.repository';
import { WorkerManager } from 'shared/worker/worker.manager';
import { WorkerModule } from 'shared/worker/worker.module';

import { HetznerS3Service } from '../shared/services/hetzner-s3.service';
import { RapidGatorDownloadService } from '../shared/services/rapid-gator-download.service';
import { UploadStoryMediaToStorageController } from './upload-story-media-to-storage.controller';
import { UploadStoryMediaToStorageService } from './upload-story-media-to-storage.service';
import { UploadStoryMediaToStorageWorker } from './upload-story-media-to-storage.worker';

@Module({
  imports: [ConfigModule, WorkerModule],
  controllers: [UploadStoryMediaToStorageController],
  providers: [
    UploadStoryMediaToStorageService,
    UploadStoryMediaToStorageWorker,
    PostRepository,
    StoryRepository,
    RapidGatorDownloadService,
    HetznerS3Service,
  ],
})
export class UploadStoryMediaToStorageModule implements OnModuleInit {
  constructor(
    private readonly workerManager: WorkerManager,
    private readonly uploadStoryMediaToStorageWorker: UploadStoryMediaToStorageWorker,
  ) {}

  onModuleInit() {
    this.workerManager.register(this.uploadStoryMediaToStorageWorker);
  }
}
