import { Post } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_MEDIA_WORKER_NAME } from './constants/crawl-media.constant';

@ApiAdminController({
    name: 'Crawl Media',
    authRequired: true,
})
export class CrawlMediaController extends BaseController {
    constructor(
        private readonly workerManager: WorkerManager,
    ) {
        super();
    }

    @Post('trigger')
    @ApiBaseOkResponse({})
    public async triggerCrawlMedia() {
        this.workerManager.startJob(CRAWL_MEDIA_WORKER_NAME);

        return {
            message: 'Crawl media process started',
            status: 'started',
            workerName: CRAWL_MEDIA_WORKER_NAME,
        };
    }
}

