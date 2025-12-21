import { Injectable } from '@nestjs/common';
import { CrawlProcessEntity } from 'database/entities';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { MessageCode } from 'shared/constants/app.constant';
import { ApiBadRequestException } from 'shared/types';

import { TriggerCrawlProcessReqDto } from './dto/request.dto';

@Injectable()
export class CrawlProcessService {
    constructor(
        private crawlProcessRepository: CrawlProcessRepository,
        private categoryRepository: CategoryRepository,
    ) { }

    public async getActiveProcess(): Promise<CrawlProcessEntity | null> {
        return this.crawlProcessRepository.getActiveProcess();
    }

    public async triggerCrawlProcess(body: TriggerCrawlProcessReqDto): Promise<void> {
        const category = await this.categoryRepository.findOne({ where: { id: body.categoryId } });

        if (!category) {
            throw new ApiBadRequestException(MessageCode.categoryNotFound, 'Category not found');
        }

        const hasInProgressProcess = await this.crawlProcessRepository.checkInProgressProcess();

        if (hasInProgressProcess) {
            throw new ApiBadRequestException(MessageCode.crawlInProgress, 'A crawl process is already running');
        }

        await this.crawlProcessRepository.createCrawlProcess(category);
    }
}

