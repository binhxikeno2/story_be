import { Injectable, OnModuleInit } from '@nestjs/common';
import { logger } from 'shared/logger/app.logger';
import { sleep } from 'shared/utils/sleep.util';
import { IWorker } from 'shared/worker/worker.interface';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_POST_WORKER_NAME, PROCESS_POST_SLEEP } from './constants';
import { CrawlPostJobService } from './service/crawlPostJob.service';

@Injectable()
export class CrawlPostJobWorker implements OnModuleInit, IWorker {
    private readonly runningProcessIds = new Set<number>();

    constructor(
        private readonly crawlPostJobService: CrawlPostJobService,
        private readonly workerManager: WorkerManager,
    ) { }

    onModuleInit(): void {
        this.workerManager.register(this);
        logger.info('🚀 CrawlPostJobWorker: Registered');
    }

    getName(): string {
        return CRAWL_POST_WORKER_NAME;
    }

    isRunning(processId: number): boolean {
        return this.runningProcessIds.has(processId);
    }

    async start(processId: number): Promise<void> {
        if (this.isRunning(processId)) {
            return;
        }

        logger.info(`[CrawlPostJobWorker] Starting process ${processId}`);
        this.runningProcessIds.add(processId);

        try {
            await this.processUntilComplete(processId);
        } catch (error) {
            const errorMessage = error instanceof Error ? error : new Error(String(error));
            logger.error(`[CrawlPostJobWorker] Error processing process ${processId}:`, error);
            await this.crawlPostJobService.failedProcessCrawl(processId, errorMessage);
        } finally {
            this.runningProcessIds.delete(processId);
        }
    }

    private async processUntilComplete(processId: number): Promise<void> {
        while (true) {
            const shouldContinue = await this.crawlPostJobService.process(processId);

            if (!shouldContinue) {
                break;
            }

            await sleep(PROCESS_POST_SLEEP);
        }
    }
}
