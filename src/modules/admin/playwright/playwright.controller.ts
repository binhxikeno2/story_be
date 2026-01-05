import { Post } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { WorkerManager } from 'shared/worker/worker.manager';

import { PLAYWRIGHT_WORKER_NAME } from './constants/playwright.constant';

@ApiAdminController({
    name: 'Playwright',
    authRequired: true,
})
export class PlaywrightController extends BaseController {
    constructor(
        private readonly workerManager: WorkerManager,
    ) {
        super();
    }

    @Post('trigger')
    @ApiBaseOkResponse({})
    public async triggerPlaywright() {
        this.workerManager.startJob(PLAYWRIGHT_WORKER_NAME);

        return {
            message: 'Playwright session started',
            status: 'started',
            workerName: PLAYWRIGHT_WORKER_NAME,
        };
    }
}

