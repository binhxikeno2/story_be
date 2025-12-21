import { Module } from '@nestjs/common';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';

import { CrawlProcessController } from './crawlProcess.controller';
import { CrawlProcessService } from './crawlProcess.service';

@Module({
    imports: [],
    controllers: [CrawlProcessController],
    providers: [CrawlProcessService, CrawlProcessRepository, CategoryRepository],
})
export class CrawlProcessModule { }

