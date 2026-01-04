import { Injectable } from '@nestjs/common';

import { IWorker } from '../../../../shared/worker/worker.interface';
import { CRAWL_CATEGORY_DETAIL_WORKER_NAME } from '../constants/crawl-category-detail.constant';
import { CrawlCategoryDetailService } from '../services/crawl-category-detail.service';

@Injectable()
export class CrawlCategoryDetailWorker implements IWorker {
    private isProcessing = false;

    constructor(
        private readonly crawlCategoryDetailService: CrawlCategoryDetailService,
    ) { }

    getName(): string {
        return CRAWL_CATEGORY_DETAIL_WORKER_NAME;
    }

    async start(): Promise<void> {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        this.crawlCategoryDetailService.onCrawlCategoryDetail()
            .finally(() => {
                this.isProcessing = false;
            });
    }

    isRunning(): boolean {
        return this.isProcessing;
    }
}

