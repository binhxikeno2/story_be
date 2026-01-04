import { Injectable } from '@nestjs/common';
import { StoryEntity } from 'database/entities';
import { DataSource, IsNull } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class StoryRepository extends BaseRepository<StoryEntity> {
    constructor(dataSource: DataSource) {
        super(StoryEntity, dataSource);
    }

    async findStoriesReadyCrawlMedia(): Promise<StoryEntity[]> {
        return this.getRepository().find({
            where: {
                rapidGatorUrl: IsNull(),
            },
            order: {
                id: 'ASC',
            },
        });
    }
}

