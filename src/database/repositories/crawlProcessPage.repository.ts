import { Injectable } from '@nestjs/common';
import { CrawlProcessPageEntity } from 'database/entities';
import { DeepPartial } from 'typeorm';
import { DataSource } from 'typeorm';

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
}

