import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkerModule } from 'shared/worker/worker.module';

import { ScrollJobScheduler } from './scroll-job.scheduler';

@Module({
  imports: [ConfigModule, WorkerModule],
  providers: [ScrollJobScheduler],
})
export class ScrollJobModule {}
