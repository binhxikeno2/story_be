import { Injectable } from '@nestjs/common';

import { IWorker } from '../../../../shared/worker/worker.interface';
import { CRAWL_MEDIA_WORKER_NAME } from '../constants/crawl-media.constant';
import { CrawlMediaService } from '../services/crawl-media.service';

@Injectable()
export class CrawlMediaWorker implements IWorker {
    private isProcessing = false;

    constructor(
        private readonly crawlMediaService: CrawlMediaService,
    ) { }

    getName(): string {
        return CRAWL_MEDIA_WORKER_NAME;
    }

    async start(): Promise<void> {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        this.crawlMediaService.onCrawlMedia()
            .finally(() => {
                this.isProcessing = false;
            });
    }

    isRunning(): boolean {
        return this.isProcessing;
    }
}

