import { forwardRef,Module } from '@nestjs/common';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessItemRepository } from 'database/repositories/crawlProcessItem.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';

import { CrawlWorkerModule } from '../crawlWorker/crawlWorker.module';
import { CrawlProcessController } from './crawlProcess.controller';
import { CrawlProcessService } from './crawlProcess.service';

@Module({
    imports: [forwardRef(() => CrawlWorkerModule)],
    controllers: [CrawlProcessController],
    providers: [
        CrawlProcessService,
        CrawlProcessRepository,
        CategoryRepository,
        CrawlProcessPageRepository,
        CrawlProcessItemRepository,
    ],
    exports: [CrawlProcessService],
})
export class CrawlProcessModule {}

