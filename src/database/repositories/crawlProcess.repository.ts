import { Injectable } from '@nestjs/common';
import { CategoryEntity, CrawlProcessEntity } from 'database/entities';
import { CRAWL_PROCESS_POSTS_LIMIT } from 'modules/admin/crawlProcess/crawlProcess.constant';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { DataSource, In } from 'typeorm';

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
            .where('crawlProcess.status in (:...status)', { status: [CrawlStatus.RUNNING_DETAIL, CrawlStatus.ERROR] })
            .orderBy('crawlProcess.createdAt', 'DESC')
            .getOne();
    }

    public async checkInProgressProcess(): Promise<boolean> {
        const process = await this.findOne({
            where: {
                status: In([
                    CrawlStatus.CREATED,
                    CrawlStatus.RUNNING,
                    CrawlStatus.RUNNING_PAGE,
                    CrawlStatus.RUNNING_DETAIL,
                    CrawlStatus.FINALIZING,
                ]),
            },
        });

        return !!process;
    }

    public async createCrawlProcess(
        category: CategoryEntity,
        pageFrom: number,
        pageTo: number,
    ): Promise<CrawlProcessEntity> {
        const now = new Date();
        const name = `Crawl Process - ${category.name} - ${now.toISOString()}`;

        const process = this.getRepository().create({
            name,
            status: CrawlStatus.CREATED,
            limitTime: CRAWL_PROCESS_POSTS_LIMIT,
            pageFrom,
            pageTo,
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
