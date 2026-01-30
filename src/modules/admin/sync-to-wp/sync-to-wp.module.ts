import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoryRepository } from 'database/repositories/category.repository';
import { PostRepository } from 'database/repositories/post.repository';
import { TagRepository } from 'database/repositories/tag.repository';
import { WorkerManager } from 'shared/worker/worker.manager';
import { WorkerModule } from 'shared/worker/worker.module';

import { SyncToCategoryService } from './services/sync-to-category.service';
import { SyncToPostService } from './services/sync-to-post.service';
import { SyncToTagService } from './services/sync-to-tag.service';
import { SyncToWpService } from './services/sync-to-wp.service';
import { SyncToWpController } from './sync-to-wp.controller';
import { SyncToWpWorker } from './sync-to-wp.worker';

@Module({
  imports: [WorkerModule, ConfigModule],
  controllers: [SyncToWpController],
  providers: [
    SyncToWpService,
    SyncToWpWorker,
    SyncToCategoryService,
    SyncToTagService,
    SyncToPostService,
    CategoryRepository,
    TagRepository,
    PostRepository,
  ],
})
export class SyncToWpModule implements OnModuleInit {
  constructor(private readonly workerManager: WorkerManager, private readonly syncToWpWorker: SyncToWpWorker) {}

  onModuleInit() {
    this.workerManager.register(this.syncToWpWorker);
  }
}
