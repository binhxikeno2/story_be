import { Injectable } from '@nestjs/common';
import { StoryEntity } from 'database/entities';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class StoryRepository extends BaseRepository<StoryEntity> {
  constructor(dataSource: DataSource) {
    super(StoryEntity, dataSource);
  }

  async findStoriesReadyCrawlMedia(): Promise<StoryEntity[]> {
    return this.getRepository()
      .createQueryBuilder('story')
      .select(['story.id', 'story.media'])
      .where('story.rapid_gator_url IS NULL')
      .orderBy('story.id', 'ASC')
      .getMany();
  }
}
