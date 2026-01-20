import { Post } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { WorkerManager } from 'shared/worker/worker.manager';

import { UPLOAD_THUMBNAIL_POST_TO_STORAGE_WORKER_NAME } from './upload-thumbnail-post-to-storage.constant';

@ApiAdminController({
  name: 'UploadThumbnailPostToStorage',
  authRequired: true,
})
export class UploadThumbnailPostToStorageController extends BaseController {
  constructor(private readonly workerManager: WorkerManager) {
    super();
  }

  @Post('start')
  @ApiBaseOkResponse({
    summary: 'Start upload thumbnail post to storage',
  })
  public async start(): Promise<void> {
    this.workerManager.startJob(UPLOAD_THUMBNAIL_POST_TO_STORAGE_WORKER_NAME);
  }
}
