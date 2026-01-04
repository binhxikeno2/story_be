import { Injectable } from '@nestjs/common';
import { CrawlCategoryItemEntity } from 'database/entities';
import { CrawlCategoryItemRepository } from 'database/repositories/crawlCategoryItem.repository';
import { CrawlStatus } from 'shared/constants/crawl.constant';

@Injectable()
export class CrawlCategoryItemService {
    constructor(private readonly crawlCategoryItemRepository: CrawlCategoryItemRepository) { }

    async createItems(
        processId: number,
        baseUrl: string,
        pageFrom: number,
        pageTo: number,
    ): Promise<CrawlCategoryItemEntity[]> {
        const items: Partial<CrawlCategoryItemEntity>[] = [];

        for (let pageNo = pageFrom; pageNo <= pageTo; pageNo++) {
            let url = baseUrl;
            if (pageNo > 1) {
                const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                url = `${cleanBaseUrl}/page/${pageNo}`;
            }

            items.push({
                processId,
                pageNo,
                url,
                status: CrawlStatus.PENDING,
            });
        }

        const createdItems = await this.crawlCategoryItemRepository.bulkSave(
            items as Partial<CrawlCategoryItemEntity>[],
        );

        return createdItems;
    }
}
