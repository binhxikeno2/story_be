import { Injectable } from '@nestjs/common';

import { IWorker } from '../../../../shared/worker/worker.interface';
import { CRAWL_POST_WORKER_NAME } from '../constants/crawl-post.constant';
import { CrawlPostService } from '../services/crawl-post.service';

@Injectable()
export class CrawlPostWorker implements IWorker {
    private isProcessing = false;

    constructor(
        private readonly crawlPostService: CrawlPostService,
    ) { }

    getName(): string {
        return CRAWL_POST_WORKER_NAME;
    }

    async start(): Promise<void> {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        this.crawlPostService.onCrawlPost()
            .finally(() => {
                this.isProcessing = false;
            });
    }

    isRunning(): boolean {
        return this.isProcessing;
    }
}

