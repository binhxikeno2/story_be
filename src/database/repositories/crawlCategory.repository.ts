import { Injectable } from '@nestjs/common';
import { CrawlCategoryEntity } from 'database/entities';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { DataSource, In } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class CrawlCategoryRepository extends BaseRepository<CrawlCategoryEntity> {
    constructor(dataSource: DataSource) {
        super(CrawlCategoryEntity, dataSource);
    }

    public async findLastedCrawlCategory(categoryId: number): Promise<CrawlCategoryEntity | null> {
        return this.getRepository().findOne({
            where: {
                categoryId,
                status: In([CrawlStatus.DONE, CrawlStatus.CREATED])
            },
            order: { startedProcessAt: 'DESC' },
        });
    }

    public async findCrawlCategoriesReadyCrawl(): Promise<CrawlCategoryEntity[]> {
        return this.getRepository()
            .createQueryBuilder('crawlCategory')
            .innerJoinAndSelect('crawlCategory.category', 'category')
            .innerJoin(
                'crawl_category_item',
                'item',
                'item.process_id = crawlCategory.id AND item.status IN (:...pendingStatuses)',
                { pendingStatuses: [CrawlStatus.PENDING, CrawlStatus.FAILED, CrawlStatus.RUNNING] }
            )
            // .where('crawlCategory.status IN (:...statuses)', { statuses: [CrawlStatus.CREATED, CrawlStatus.RUNNING_DETAIL, CrawlStatus.FAILED] })
            .groupBy('crawlCategory.id')
            .orderBy('crawlCategory.status', 'ASC')
            .addOrderBy('crawlCategory.pageFrom', 'ASC')
            .getMany();
    }
}