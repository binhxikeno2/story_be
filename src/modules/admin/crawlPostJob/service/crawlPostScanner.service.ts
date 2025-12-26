import { Injectable, OnModuleInit } from '@nestjs/common';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { logger } from 'shared/logger/app.logger';
import { sleep } from 'shared/utils/sleep.util';

import { CrawlPostJobWorker } from '../crawlPostJob.worker';

@Injectable()
export class CrawlPostScanner implements OnModuleInit {
    private readonly SCAN_INTERVAL_MS = 5000;
    private isRunning = false;

    constructor(
        private readonly crawlProcessRepository: CrawlProcessRepository,
        private readonly crawlPostJobWorker: CrawlPostJobWorker,
    ) { }

    onModuleInit(): void {
        this.startScanLoop();
    }

    private async startScanLoop(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        logger.info('🔍 CrawlPostScanner: Starting scan loop...');

        while (this.isRunning) {
            try {
                await this.scanAndStartNewProcess();
            } catch (error) {
                logger.error('[CrawlPostScanner] Error in scan loop:', error);
            }

            await sleep(this.SCAN_INTERVAL_MS);
        }
    }

    private async scanAndStartNewProcess(): Promise<void> {
        const newProcess = await this.crawlProcessRepository.findOne({
            where: { status: CrawlStatus.CREATED },
            relations: ['category'],
        });

        if (!newProcess) {
            return;
        }

        this.crawlPostJobWorker.start(newProcess.id).catch((error) => {
            logger.error(`[CrawlPostScanner] Error auto-starting process ${newProcess.id}:`, error);
        });
    }
}

