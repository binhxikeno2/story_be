import { Injectable } from '@nestjs/common';
import { CrawlProcessItemEntity } from 'database/entities';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class CrawlProcessItemRepository extends BaseRepository<CrawlProcessItemEntity> {
    constructor(dataSource: DataSource) {
        super(CrawlProcessItemEntity, dataSource);
    }

    public async findPendingItems(processPageId: number, limit = 10): Promise<CrawlProcessItemEntity[]> {
        return this.find({
            where: {
                processPageId,
                status: CrawlStatus.PENDING,
            },
            take: limit,
            order: {
                id: 'ASC',
            },
        });
    }
}

