import { Post } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_CATEGORY_DETAIL_WORKER_NAME } from './constants/crawl-category-detail.constant';

@ApiAdminController({
    name: 'Crawl Category Detail',
    authRequired: true,
})
export class CrawlCategoryDetailController extends BaseController {
    constructor(
        private readonly workerManager: WorkerManager,
    ) {
        super();
    }

    @Post('trigger')
    @ApiBaseOkResponse({})
    public async triggerCrawlCategoryDetail() {
        this.workerManager.startJob(CRAWL_CATEGORY_DETAIL_WORKER_NAME);

        return {
            message: 'Crawl category detail process started',
            status: 'started',
            workerName: CRAWL_CATEGORY_DETAIL_WORKER_NAME,
        };
    }
}

