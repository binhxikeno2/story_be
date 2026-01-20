import { Post } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_POST_WORKER_NAME } from './crawl-post.constant';

@ApiAdminController({
  name: 'CrawlPost',
  authRequired: true,
})
export class CrawlPostController extends BaseController {
  constructor(private readonly workerManager: WorkerManager) {
    super();
  }

  @Post('start')
  @ApiBaseOkResponse({
    summary: 'Start crawl post',
  })
  public async start(): Promise<void> {
    this.workerManager.startJob(CRAWL_POST_WORKER_NAME);
  }
}
