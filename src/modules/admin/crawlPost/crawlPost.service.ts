import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CrawlProcessEntity, CrawlProcessPageEntity } from 'database/entities';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessPageRepository } from 'database/repositories/crawlProcessPage.repository';
import { MessageCode } from 'shared/constants/app.constant';
import { ApiBadRequestException } from 'shared/types';
import { WorkerManager } from 'shared/worker/worker.manager';

import { CRAWL_POST_WORKER_NAME } from '../crawlPostJob/constants';
import { TriggerCrawlPostReqDto } from './dto/request.dto';

@Injectable()
export class CrawlPostService {
    constructor(
        private readonly crawlProcessRepository: CrawlProcessRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly crawlProcessPageRepository: CrawlProcessPageRepository,
        @Inject(forwardRef(() => WorkerManager))
        private readonly workerManager: WorkerManager,
    ) { }

    public async getActiveProcess(): Promise<CrawlProcessEntity | null> {
        return this.crawlProcessRepository.getActiveProcess();
    }

    public async triggerCrawlPost(body: TriggerCrawlPostReqDto): Promise<void> {
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

        const baseUrl = category.url3thParty || '';
        const crawlProcessPages: Partial<CrawlProcessPageEntity>[] = [];

        for (let pageNo = body.pageFrom; pageNo <= body.pageTo; pageNo++) {
            let url = '';

            if (baseUrl) {
                const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                url = `${cleanBaseUrl}/page/${pageNo}`;
            }

            crawlProcessPages.push({
                processId: crawlProcess.id,
                pageNo,
                url,
            });
        }

        await this.crawlProcessPageRepository.bulkSave(crawlProcessPages);

        this.workerManager.startJob(CRAWL_POST_WORKER_NAME, crawlProcess.id);
    }
}

