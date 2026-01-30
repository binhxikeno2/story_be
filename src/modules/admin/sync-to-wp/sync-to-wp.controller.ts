import { Post } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { WorkerManager } from 'shared/worker/worker.manager';

import { SYNC_TO_WP_WORKER_NAME } from './sync-to-wp.constant';

@ApiAdminController({
  name: 'SyncToWp',
  authRequired: true,
})
export class SyncToWpController extends BaseController {
  constructor(private readonly workerManager: WorkerManager) {
    super();
  }

  @Post('start')
  @ApiBaseOkResponse({
    summary: 'Start sync to WP',
  })
  public async start(): Promise<void> {
    this.workerManager.startJob(SYNC_TO_WP_WORKER_NAME);
  }
}
