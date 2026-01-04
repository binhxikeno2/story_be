import { Post } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_POST_WORKER_NAME } from './constants/crawl-post.constant';

@ApiAdminController({
    name: 'Crawl Post',
    authRequired: true,
})
export class CrawlPostController extends BaseController {
    constructor(
        private readonly workerManager: WorkerManager,
    ) {
        super();
    }

    @Post('trigger')
    @ApiBaseOkResponse({})
    public async triggerCrawlPost() {
        this.workerManager.startJob(CRAWL_POST_WORKER_NAME);

        return {
            message: 'Crawl post process started',
            status: 'started',
            workerName: CRAWL_POST_WORKER_NAME,
        };
    }
}

