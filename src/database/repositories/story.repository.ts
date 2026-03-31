import { Injectable } from '@nestjs/common';
import { StoryEntity } from 'database/entities';
import { LIMIT_STORY } from 'modules/admin/crawl-link-media/crawl-link-media.constant';
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
      .andWhere('story.deletedAt IS NULL')
      .orderBy('story.id', 'ASC')
      .limit(LIMIT_STORY)
      .getRawMany();
  }

  async getStoriesWithEmptyInternalUrl(): Promise<Partial<StoryEntity>[]> {
    return (
      this.createQueryBuilder('story')
        .select('story.id', 'id')
        .addSelect('story.rapid_gator_url', 'rapidGatorUrl')
        .where('(story.internal_url IS NULL OR story.internal_url = "")')
        .andWhere('story.rapid_gator_url IS NOT NULL')
        .andWhere('story.deletedAt IS NULL')
        //TODO need to improve
        .andWhere('story.title NOT LIKE :gb', { gb: '%GB%' })

        // .orderBy('story.id', 'ASC')
        .orderBy(`CAST(REGEXP_SUBSTR(story.title, '[0-9]+(?= MB)') AS UNSIGNED)`, 'ASC')
        .limit(LIMIT_STORY)
        .getRawMany()
    );
  }
}
