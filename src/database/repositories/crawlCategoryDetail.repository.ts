import { Injectable } from '@nestjs/common';
import { CrawlCategoryDetailEntity } from 'database/entities';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

export type CrawlCategoryDetailReadyCrawl = { id: number; detailUrl: string; categoryId?: number }

@Injectable()
export class CrawlCategoryDetailRepository extends BaseRepository<CrawlCategoryDetailEntity> {
    constructor(dataSource: DataSource) {
        super(CrawlCategoryDetailEntity, dataSource);
    }

    async findByDetailUrl(detailUrl: string): Promise<CrawlCategoryDetailEntity | null> {
        return this.findOne({
            where: { detailUrl },
        });
    }

    async findByDetailUrls(detailUrls: string[]): Promise<CrawlCategoryDetailEntity[]> {
        if (detailUrls.length === 0) {
            return [];
        }

        return this.getRepository()
            .createQueryBuilder('detail')
            .where('detail.detailUrl IN (:...urls)', { urls: detailUrls })
            .getMany();
    }

    async findCrawlCategoryDetailReadyCrawl(): Promise<CrawlCategoryDetailReadyCrawl[]> {
        return this.getRepository()
            .createQueryBuilder('detail')
            .select('detail.id', 'id')
            .addSelect('detail.detailUrl', 'detailUrl')
            .addSelect('process.categoryId', 'categoryId')
            .innerJoin('detail.processPage', 'processPage')
            .innerJoin('processPage.process', 'process')
            .where('detail.status = :status', { status: CrawlStatus.PENDING })
            .orderBy('detail.id', 'ASC')
            .getRawMany();
    }
}

