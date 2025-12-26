import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { WorkerModule } from 'shared/worker/worker.module';

import { CrawlPostJobModule } from '../crawlPostJob/crawlPostJob.module';
import { CrawlPostController } from './crawlPost.controller';
import { CrawlPostService } from './crawlPost.service';

@Module({
    imports: [ConfigModule, forwardRef(() => CrawlPostJobModule), WorkerModule],
    controllers: [CrawlPostController],
    providers: [
        CrawlPostService,
        CrawlProcessRepository,
        CategoryRepository,
        CrawlProcessPageRepository,
        CrawlProcessItemRepository,
    ],
    exports: [CrawlPostService],
})
export class CrawlPostModule { }

