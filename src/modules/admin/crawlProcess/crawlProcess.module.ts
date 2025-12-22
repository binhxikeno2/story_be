import { Module } from '@nestjs/common';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';

import { CrawlProcessController } from './crawlProcess.controller';
import { CrawlProcessService } from './crawlProcess.service';

@Module({
    imports: [],
    controllers: [CrawlProcessController],
    providers: [CrawlProcessService, CrawlProcessRepository, CategoryRepository, CrawlProcessPageRepository],
})
export class CrawlProcessModule { }

