import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';

import { CrawlProcessService } from '../crawlProcess/crawlProcess.service';

@Injectable()
export class CrawlProcessWorker implements OnModuleInit {
    private running = new Set<number>();
    private readonly INTERVAL_MS = 5000;
    private readonly PROCESS_SLEEP_MS = 300;

    constructor(
        private readonly crawlProcessRepository: CrawlProcessRepository,
        @Inject(forwardRef(() => CrawlProcessService))
        private readonly crawlProcessService: CrawlProcessService,
    ) { }

    onModuleInit() {
        logger.info('🚀 CrawlProcessWorker: Starting worker loop...');
        this.startLoop();
    }

    private startLoop() {
        this.runLoop();
    }

    private async runLoop() {
        while (true) {
            try {
                await this.processWork();
            } catch (error) {
                logger.error('CrawlProcessWorker: Error in loop', error);
            }

            await this.sleep(this.INTERVAL_MS);
        }
    }

    public async start(processId: number): Promise<void> {
        if (this.running.has(processId)) {
            logger.info(`[Worker] Process ${processId} is already running, skipping`);

            return;
        }

        this.running.add(processId);

        try {
            while (true) {
                const shouldContinue = await this.crawlProcessService.process(processId);

                if (!shouldContinue) {
                    break;
                }

                await this.sleep(this.PROCESS_SLEEP_MS);
            }
        } catch (error) {
            logger.error(`[Worker] Error processing process ${processId}:`, error);
            await this.crawlProcessService.markAsError(processId, error instanceof Error ? error : new Error(String(error)));
        } finally {
            this.running.delete(processId);
        }
    }

    private async processWork() {
        const process = await this.crawlProcessRepository.findOne({
            where: { status: CrawlStatus.CREATED },
            relations: ['category'],
        });

        if (!process) {
            return;
        }

        this.start(process.id).catch((error) => {
            logger.error(`[Worker] Error auto-starting process ${process.id}:`, error);
        });
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
