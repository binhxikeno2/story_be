import { Injectable } from '@nestjs/common';

import { SyncToCategoryService } from './sync-to-category.service';
import { SyncToPostService } from './sync-to-post.service';
import { SyncToTagService } from './sync-to-tag.service';

@Injectable()
export class SyncToWpService {
  constructor(
    private readonly syncToCategoryService: SyncToCategoryService,
    private readonly syncToTagService: SyncToTagService,
    private readonly syncToPostService: SyncToPostService,
  ) {}

  async onSyncToWp(): Promise<void> {
    await this.syncToCategoryService.syncCategory();
    await this.syncToTagService.syncTag();
    await this.syncToPostService.syncPost();
  }
}
