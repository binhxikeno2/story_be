import { Post } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { WorkerManager } from 'shared/worker/worker.manager';

import { UPLOAD_STORY_MEDIA_TO_STORAGE_WORKER_NAME } from './upload-story-media-to-storage.constant';

@ApiAdminController({
  name: 'UploadStoryMediaToStorage',
  authRequired: true,
})
export class UploadStoryMediaToStorageController extends BaseController {
  constructor(private readonly workerManager: WorkerManager) {
    super();
  }

  @Post('start')
  @ApiBaseOkResponse({
    summary: 'Start upload story media to storage',
  })
  public async start(): Promise<void> {
    this.workerManager.startJob(UPLOAD_STORY_MEDIA_TO_STORAGE_WORKER_NAME);
  }
}
