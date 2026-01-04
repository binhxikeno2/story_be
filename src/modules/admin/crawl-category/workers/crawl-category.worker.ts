import { Injectable } from '@nestjs/common';

import { IWorker } from '../../../../shared/worker/worker.interface';
import { CRAWL_CATEGORY_WORKER_NAME } from '../constants/crawl-category.constant';
import { CrawlCategoryService } from '../services/crawl-category.service';

@Injectable()
export class CrawlCategoryWorker implements IWorker {
    private isProcessing = false;

    constructor(
        private readonly crawlCategoryService: CrawlCategoryService,

    ) { }

    getName(): string {
        return CRAWL_CATEGORY_WORKER_NAME;
    }

    async start(): Promise<void> {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        this.crawlCategoryService.onCreateCrawlCategories()
            .finally(() => {
                this.isProcessing = false;
            });
    }

    isRunning(): boolean {
        return this.isProcessing;
    }
}
