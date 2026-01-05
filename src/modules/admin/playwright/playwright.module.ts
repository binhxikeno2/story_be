import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from 'shared/redis/redis.module';
import { WorkerManager } from 'shared/worker/worker.manager';
import { WorkerModule } from 'shared/worker/worker.module';

import { PlaywrightController } from './playwright.controller';
import { PlaywrightService } from './services/playwright.service';
import { PlaywrightWorker } from './workers/playwright.worker';

@Module({
    imports: [ConfigModule, WorkerModule, RedisModule],
    controllers: [PlaywrightController],
    providers: [
        PlaywrightService,
        PlaywrightWorker,
    ],
    exports: [PlaywrightWorker, PlaywrightService],
})
export class PlaywrightModule {
    constructor(
        private readonly workerManager: WorkerManager,
        private readonly playwrightWorker: PlaywrightWorker,
    ) {
        this.workerManager.register(this.playwrightWorker);
    }
}

