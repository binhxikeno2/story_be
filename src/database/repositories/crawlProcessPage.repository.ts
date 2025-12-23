import { Injectable } from '@nestjs/common';
import { CrawlProcessPageEntity } from 'database/entities';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { DataSource, DeepPartial, In } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class CrawlProcessPageRepository extends BaseRepository<CrawlProcessPageEntity> {
    constructor(dataSource: DataSource) {
        super(CrawlProcessPageEntity, dataSource);
    }

    public async batchSave(
        entities: DeepPartial<CrawlProcessPageEntity>[],
        batchSize = 1000,
        chunkSize = 100,
    ): Promise<void> {
        const manager = this.manager();

        for (let i = 0; i < entities.length; i += batchSize) {
            const batch = entities.slice(i, i + batchSize);
            await manager.save(CrawlProcessPageEntity, batch, { chunk: chunkSize });
        }
    }

    public async findPendingPages(processId: number, limit = 10): Promise<CrawlProcessPageEntity[]> {
        return this.find({
            where: {
                processId,
                status: CrawlStatus.PENDING,
            },
            take: limit,
            order: {
                pageNo: 'ASC',
            },
        });
    }

    public async upsertPages(pages: DeepPartial<CrawlProcessPageEntity>[]): Promise<void> {
        if (pages.length === 0) {
            return;
        }

        const manager = this.manager();

        const processId = pages[0].processId;
        if (!processId) {
            return;
        }

        const pageNos = pages.map((p) => p.pageNo).filter((no): no is number => no !== undefined);

        if (pageNos.length === 0) {
            return;
        }

        const existingPages = await this.find({
            where: {
                processId,
                pageNo: In(pageNos),
            },
        });

        const existingMap = new Map<number, CrawlProcessPageEntity>();
        existingPages.forEach((page) => {
            existingMap.set(page.pageNo, page);
        });

        const toUpdate: CrawlProcessPageEntity[] = [];
        const toInsert: DeepPartial<CrawlProcessPageEntity>[] = [];

        pages.forEach((page) => {
            if (!page.pageNo) {
                return;
            }

            const existing = existingMap.get(page.pageNo);
            if (existing) {
                Object.assign(existing, page);
                toUpdate.push(existing);
            } else {
                toInsert.push(page);
            }
        });

        if (toUpdate.length > 0) {
            await manager.save(CrawlProcessPageEntity, toUpdate);
        }

        if (toInsert.length > 0) {
            await manager.save(CrawlProcessPageEntity, toInsert);
        }
    }
}

