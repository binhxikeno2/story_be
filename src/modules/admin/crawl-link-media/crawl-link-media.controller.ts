import { Post } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_LINK_MEDIA_WORKER_NAME } from './crawl-link-media.constant';

@ApiAdminController({
  name: 'CrawlLinkMedia',
  authRequired: true,
})
export class CrawlLinkMediaController extends BaseController {
  constructor(private readonly workerManager: WorkerManager) {
    super();
  }

  @Post('start')
  @ApiBaseOkResponse({
    summary: 'Start crawl link media',
  })
  public async start(): Promise<void> {
    this.workerManager.startJob(CRAWL_LINK_MEDIA_WORKER_NAME);
  }
}
