import { Post } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_CATEGORY_WORKER_NAME } from './constants/crawl-category.constant';
import { CrawlCategoryService } from './services/crawl-category.service';

@ApiAdminController({
    name: 'Crawl Category',
    authRequired: true,
})
export class CrawlCategoryController extends BaseController {
    constructor(
        private readonly crawlCategoryService: CrawlCategoryService,
        private readonly workerManager: WorkerManager,
    ) {
        super();
    }

    @Post('trigger')
    @ApiBaseOkResponse({
        summary: 'Trigger crawl category process - Start the crawl category process for all categories. Returns immediately after starting the process.',
    })
    public async triggerCrawlCategory() {
        const isInProcess = await this.crawlCategoryService.isInProcessCrawl();

        if (isInProcess) {
            return {
                message: 'Crawl category process is already in progress. Please wait for current crawl to finish (status: DONE or CANCELLED)',
                status: 'in_progress',
                workerName: CRAWL_CATEGORY_WORKER_NAME,
            };
        }

        this.workerManager.startJob(CRAWL_CATEGORY_WORKER_NAME);

        return {
            message: 'Crawl category process started',
            status: 'started',
            workerName: CRAWL_CATEGORY_WORKER_NAME,
        };
    }
}
