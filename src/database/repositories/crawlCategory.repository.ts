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
            .groupBy('crawlCategory.id')
            .orderBy('crawlCategory.status', 'ASC')
            .addOrderBy('crawlCategory.pageFrom', 'ASC')
            .getMany();
    }

    public async updateCrawlCategoriesStatus(crawlCategoryIds: number[]): Promise<void> {
        if (crawlCategoryIds.length === 0) {
            return;
        }

        await this.updateFailedCrawlCategoriesStatus(crawlCategoryIds);
        await this.updateCompletedCrawlCategoriesStatus(crawlCategoryIds);
    }

    private async updateFailedCrawlCategoriesStatus(crawlCategoryIds: number[]): Promise<void> {
        // Update status to FAILED if has any FAILED items
        await this.getRepository()
            .createQueryBuilder('crawl_category')
            .update(CrawlCategoryEntity)
            .set({ status: CrawlStatus.FAILED })
            .where('crawl_category.id IN (:...ids)', { ids: crawlCategoryIds })
            .andWhere(
                `EXISTS (
                    SELECT 1 
                    FROM crawl_category_item item 
                    WHERE item.process_id = crawl_category.id 
                    AND item.status = :failedStatus
                )`,
                { failedStatus: CrawlStatus.FAILED }
            )
            .execute();
    }

    private async updateCompletedCrawlCategoriesStatus(crawlCategoryIds: number[]): Promise<void> {
        // Update status to DONE if all items are DONE (no FAILED items)
        await this.getRepository()
            .createQueryBuilder('crawl_category')
            .update(CrawlCategoryEntity)
            .set({ status: CrawlStatus.DONE })
            .where('crawl_category.id IN (:...ids)', { ids: crawlCategoryIds })
            .andWhere(
                `NOT EXISTS (
                    SELECT 1 
                    FROM crawl_category_item item 
                    WHERE item.process_id = crawl_category.id 
                    AND item.status = :failedStatus
                )`,
                { failedStatus: CrawlStatus.FAILED }
            )
            .execute();
    }
}