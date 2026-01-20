import { Injectable } from '@nestjs/common';
import { StoryEntity } from 'database/entities';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class StoryRepository extends BaseRepository<StoryEntity> {
  constructor(dataSource: DataSource) {
    super(StoryEntity, dataSource);
  }

  async getStoriesWithEmptyRapidGatorUrl(): Promise<Partial<StoryEntity>[]> {
    return this.createQueryBuilder('story')
      .select('story.id', 'id')
      .addSelect('story.media', 'media')
      .where('story.rapid_gator_url IS NULL')
      .orderBy('story.id', 'ASC')
      .getRawMany();
  }

  async getStoriesWithEmptyInternalUrl(): Promise<Partial<StoryEntity>[]> {
    return this.createQueryBuilder('story')
      .select('story.id', 'id')
      .addSelect('story.rapid_gator_url', 'rapidGatorUrl')
      .where('story.internal_url IS NULL')
      .andWhere('story.rapid_gator_url IS NOT NULL')
      .orderBy('story.id', 'ASC')
      .getRawMany();
  }
}
