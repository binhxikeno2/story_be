import { Injectable } from '@nestjs/common';
import { ChapterEntity, StoryEntity } from 'database/entities';
import { PostRepository } from 'database/repositories/post.repository';
import { StoryRepository } from 'database/repositories/story.repository';

@Injectable()
export class AnalyticsPostService {
  constructor(private postRepository: PostRepository, private storyRepository: StoryRepository) {}

  public async getAnalyticsPost() {
    const totalPost = await this.postRepository
      .createQueryBuilder('post')
      .leftJoin('category', 'category', 'category.id = post.category_id')
      .where('post.title != :title', { title: '' })
      .andWhere('internal_thumbnail_url IS NOT NULL')
      .groupBy('post.id')
      .getCount();

    const totalPostReadyToSync = await this.postRepository
      .createQueryBuilder('p')
      .where('p.category_id IS NOT NULL')
      .andWhere('p.title IS NOT NULL')
      .andWhere('p.internal_thumbnail_url IS NOT NULL')
      .andWhere('p.3happy_guy_post_id IS NULL')
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from(ChapterEntity, 'c')
          .innerJoin(StoryEntity, 's', 's.chapter_id = c.id')
          .where('c.post_id = p.id')
          .andWhere('(s.rapid_gator_url IS NULL OR s.internal_url IS NULL)')
          .getQuery();

        return `NOT EXISTS ${subQuery}`;
      })
      .groupBy('post.id')
      .getCount();

    const totalPostSynced = await this.postRepository
      .createQueryBuilder('post')
      .where('post.category_id IS NOT NULL')
      .andWhere('post.title IS NOT NULL')
      .andWhere('post.internal_thumbnail_url IS NOT NULL')
      .andWhere('post.3happy_guy_post_id IS NOT NULL')
      .groupBy('post.id')
      .getCount();

    return {
      totalPost,
      totalPostReadyToSync,
      totalWaitingProcess: totalPost - totalPostReadyToSync - totalPostSynced,
      totalPostSynced,
    };
  }

  public async getAnalyticsStory() {
    const totalStory = await this.storyRepository.createQueryBuilder('story').getCount();

    const totalStoryCrawledRapidLink = await this.storyRepository
      .createQueryBuilder('story')
      .where('story.rapid_gator_url IS NOT NULL')
      .getCount();

    const totalStoryInternalLink = await this.storyRepository
      .createQueryBuilder('story')
      .where('story.rapid_gator_url IS NOT NULL')
      .andWhere('story.internal_url IS NOT NULL')
      .getCount();

    const totalStoryReadyGetInternalLink = await this.storyRepository
      .createQueryBuilder('story')
      .where('story.rapid_gator_url IS NOT NULL')
      .andWhere('story.internal_url IS NOT NULL')
      .getCount();

    return {
      totalStory,
      totalStoryCrawledRapidLink,
      totalStoryInternalLink,
      totalStoryReadyGetInternalLink,
      totalStorySynced: 0,
    };
  }
}
