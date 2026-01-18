import { Post } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_PROCESS_WORKER_NAME } from './crawl-process.constant';

@ApiAdminController({
  name: 'CrawlProcess',
  authRequired: true,
})
export class CrawlProcessController extends BaseController {
  constructor(private readonly workerManager: WorkerManager) {
    super();
  }

  @Post('start')
  @ApiBaseOkResponse({
    summary: 'Start crawl process',
  })
  public async start(): Promise<void> {
    await this.workerManager.startJob(CRAWL_PROCESS_WORKER_NAME);
  }
}
