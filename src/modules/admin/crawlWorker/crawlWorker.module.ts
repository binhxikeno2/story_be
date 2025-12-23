import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';

import { CrawlProcessModule } from '../crawlProcess/crawlProcess.module';
import { CrawlProcessWorker } from './crawlWorker.worker';
import { DetailCrawler } from './detailCrawler.service';
import { PageCrawler } from './pageCrawler.service';

@Module({
    imports: [ConfigModule, forwardRef(() => CrawlProcessModule)],
    providers: [
        CrawlProcessWorker,
        CrawlProcessRepository,
        CrawlProcessPageRepository,
        CrawlProcessItemRepository,
        PageCrawler,
        DetailCrawler,
    ],
    exports: [CrawlProcessWorker, PageCrawler, DetailCrawler],
})
export class CrawlWorkerModule { }

