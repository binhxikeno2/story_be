import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { PostRepository } from 'database/repositories/post.repository';
import { WorkerModule } from 'shared/worker/worker.module';

import { CrawlPostModule } from '../crawlPost/crawlPost.module';
import { HtmlParserModule } from '../htmlParser/htmlParser.module';
import { CrawlPostJobWorker } from './crawlPostJob.worker';
import { CrawlPostJobService } from './service/crawlPostJob.service';
import { CrawlPostScanner } from './service/crawlPostScanner.service';
import { DetailCrawler } from './service/detailCrawler.service';
import { PageCrawler } from './service/pageCrawler.service';
import { ProcessStatusService } from './service/processStatus.service';
import { ThirdPartyFetchService } from './service/thirdPartyFetch.service';

@Module({
    imports: [ConfigModule, forwardRef(() => CrawlPostModule), HtmlParserModule, WorkerModule],
    providers: [
        CrawlPostJobWorker,
        CrawlPostScanner,
        CrawlPostJobService,
        CrawlProcessRepository,
        CrawlProcessPageRepository,
        CrawlProcessItemRepository,
        PostRepository,
        ProcessStatusService,
        ThirdPartyFetchService,
        PageCrawler,
        DetailCrawler,
    ],
    exports: [CrawlPostJobWorker, CrawlPostJobService, PageCrawler, DetailCrawler],
})
export class CrawlPostJobModule { }

