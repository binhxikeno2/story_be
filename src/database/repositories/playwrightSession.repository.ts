import { Injectable } from '@nestjs/common';
import { PlaywrightSessionEntity } from 'database/entities';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class PlaywrightSessionRepository extends BaseRepository<PlaywrightSessionEntity> {
    constructor(dataSource: DataSource) {
        super(PlaywrightSessionEntity, dataSource);
    }

    async findActiveSession(): Promise<PlaywrightSessionEntity | null> {
        return this.findOne({
            where: {
                isVerified: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }
}

