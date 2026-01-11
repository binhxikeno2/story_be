import { Injectable } from '@nestjs/common';
import { CrawlCategoryItemEntity } from 'database/entities';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { DataSource, In } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class CrawlCategoryItemRepository extends BaseRepository<CrawlCategoryItemEntity> {
    constructor(dataSource: DataSource) {
        super(CrawlCategoryItemEntity, dataSource);
    }

    public async findCrawlCategoryItemsReadyCrawl(processId: number): Promise<CrawlCategoryItemEntity[]> {
        return this.getRepository().find({
            where: {
                processId,
                status: In([CrawlStatus.PENDING, CrawlStatus.RUNNING, CrawlStatus.FAILED])
            },
            order: { status: 'ASC', pageNo: 'ASC' },
        });
    }

    public async hasPendingOrRunningItems(processId: number): Promise<boolean> {
        const count = await this.getRepository().count({
            where: {
                processId,
                status: In([CrawlStatus.PENDING, CrawlStatus.RUNNING, CrawlStatus.FAILED])
            },
        });

        return count > 0;
    }
}

