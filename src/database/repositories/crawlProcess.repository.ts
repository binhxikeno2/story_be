import { Injectable } from '@nestjs/common';
import { CategoryEntity, CrawlProcessEntity, CrawlStatus } from 'database/entities';
import { CRAWL_PROCESS_POSTS_LIMIT } from 'modules/admin/crawlProcess/crawlProcess.constant';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class CrawlProcessRepository extends BaseRepository<CrawlProcessEntity> {
    constructor(dataSource: DataSource) {
        super(CrawlProcessEntity, dataSource);
    }

    public async getActiveProcess(): Promise<CrawlProcessEntity | null> {
        return await this.getRepository()
            .createQueryBuilder('crawlProcess')
            .leftJoinAndSelect('crawlProcess.category', 'category')
            .where('crawlProcess.status in (:...status)', { status: [CrawlStatus.IN_PROGRESS, CrawlStatus.ERROR] })
            .orderBy('crawlProcess.createdAt', 'DESC')
            .getOne();
    }

    public async checkInProgressProcess(): Promise<boolean> {
        const process = await this.findOne({
            where: { status: CrawlStatus.IN_PROGRESS },
        });

        return !!process;
    }

    public async createCrawlProcess(category: CategoryEntity): Promise<CrawlProcessEntity> {
        const now = new Date();
        const name = `Crawl Process - ${category.name} - ${now.toISOString()}`;

        const process = this.getRepository().create({
            name,
            status: CrawlStatus.IN_PROGRESS,
            limitTime: CRAWL_PROCESS_POSTS_LIMIT,
            startedProcessAt: now,
            category,
        });

        const savedProcess = await this.save(process);

        const processWithCategory = await this.getRepository()
            .findOne({
                where: { id: savedProcess.id },
                relations: ['category'],
            });

        if (!processWithCategory) {
            throw new Error('Failed to create crawl process');
        }

        return processWithCategory;
    }
}
