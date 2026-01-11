import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkerModule } from 'shared/worker/worker.module';

import { CrawlCategoryModule } from '../crawl-category/crawl-category.module';
import { ScrollJobScheduler } from './scroll-job.scheduler';

@Module({
    imports: [ConfigModule, WorkerModule, CrawlCategoryModule],
    providers: [ScrollJobScheduler],
})
export class ScrollJobModule { }

