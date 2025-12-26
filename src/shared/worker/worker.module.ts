import { Module } from '@nestjs/common';

import { WorkerManager } from './worker.manager';

@Module({
    providers: [WorkerManager],
    exports: [WorkerManager],
})
export class WorkerModule { }

