import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from 'shared/logger/app.logger';

import { IWorker } from '../../../../shared/worker/worker.interface';
import { PLAYWRIGHT_WORKER_NAME } from '../constants/playwright.constant';
import { PlaywrightService } from '../services/playwright.service';

@Injectable()
export class PlaywrightWorker implements IWorker {
    private isProcessing = false;

    constructor(
        private readonly playwrightService: PlaywrightService,
        private readonly configService: ConfigService,
    ) { }

    getName(): string {
        return PLAYWRIGHT_WORKER_NAME;
    }

    async start(): Promise<void> {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        try {
            const targetUrl = this.configService.get<string>('PLAYWRIGHT_TARGET_URL') || 'https://example.com';
            await this.playwrightService.initializeSession(targetUrl);
        } catch (error) {
            logger.error('[PlaywrightWorker] Error starting Playwright session:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    isRunning(): boolean {
        return this.isProcessing;
    }

    async refreshSession(url?: string): Promise<void> {
        if (this.isProcessing) {
            logger.warn('[PlaywrightWorker] Cannot refresh while processing, skipping...');

            return;
        }

        this.isProcessing = true;

        try {
            logger.info('[PlaywrightWorker] Refreshing Playwright session...');
            await this.playwrightService.refreshSession(url);
            logger.info('[PlaywrightWorker] Playwright session refreshed successfully');
        } catch (error) {
            logger.error('[PlaywrightWorker] Error refreshing Playwright session:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }
}

