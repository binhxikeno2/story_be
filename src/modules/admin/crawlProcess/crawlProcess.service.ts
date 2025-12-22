import { Injectable } from '@nestjs/common';
import { CrawlProcessEntity, CrawlProcessPageEntity } from 'database/entities';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { MessageCode } from 'shared/constants/app.constant';
import { ApiBadRequestException } from 'shared/types';

import { TriggerCrawlProcessReqDto } from './dto/request.dto';

@Injectable()
export class CrawlProcessService {
    constructor(
        private crawlProcessRepository: CrawlProcessRepository,
        private categoryRepository: CategoryRepository,
        private crawlProcessPageRepository: CrawlProcessPageRepository,
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

        if (body.pageFrom < 1 || body.pageTo < 1 || body.pageFrom > body.pageTo) {
            throw new ApiBadRequestException(MessageCode.invalidInput, 'Invalid page range');
        }

        const crawlProcess = await this.crawlProcessRepository.createCrawlProcess(
            category,
            body.pageFrom,
            body.pageTo,
        );

        // Create CrawlProcessPageEntity for each pageNo in range
        const baseUrl = category.url3thParty || '';
        const crawlProcessPages: Partial<CrawlProcessPageEntity>[] = [];

        for (let pageNo = body.pageFrom; pageNo <= body.pageTo; pageNo++) {
            const url = baseUrl ? `${baseUrl}?page=${pageNo}` : '';
            crawlProcessPages.push({
                processId: crawlProcess.id,
                pageNo,
                url,
            });
        }

        await this.crawlProcessPageRepository.bulkSave(crawlProcessPages);
    }
}

