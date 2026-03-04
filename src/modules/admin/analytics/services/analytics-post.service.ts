import { Injectable } from '@nestjs/common';
import { PostRepository } from 'database/repositories/post.repository';
import { StoryRepository } from 'database/repositories/story.repository';

@Injectable()
export class AnalyticsPostService {
  constructor(private postRepository: PostRepository, private storyRepository: StoryRepository) {}

  public async getAnalyticsPost() {
    const totalPostReadyToSync = await this.postRepository
      .createQueryBuilder('post')
      .innerJoin('post.category', 'category')
      .orderBy('post.lastUpdated', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .andWhere("post.title IS NOT NULL AND post.title <> ''")
      .andWhere('post.internal_thumbnail_url IS NOT NULL')
      .andWhere('post.3happy_guy_post_id IS NULL')
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('1')
          .from('story', 's')
          .innerJoin('chapter', 'c', 's.chapter_id = c.id')
          .where('c.post_id = post.id')
          .andWhere("(s.internal_url IS NULL OR s.internal_url = '')")
          .getQuery();

        return `NOT EXISTS ${sub}`;
      })
      .getCount();

    const queryData = await this.postRepository
      .createQueryBuilder('post')
      .select('COUNT(*)', 'totalPost')
      .addSelect('COUNT(CASE WHEN post.id IS NOT NULL THEN 1 END)', 'totalPost')
      .addSelect('COUNT(CASE WHEN post.3happy_guy_post_id IS NOT NULL THEN 1 END)', 'totalPostSynced')
      .getRawOne();

    return { ...queryData, totalPostReadyToSync };
  }

  public async getAnalyticsStory() {
    const queryData = await this.storyRepository
      .createQueryBuilder('story')
      .select('COUNT(*)', 'totalStory')
      .addSelect('COUNT(CASE WHEN story.rapid_gator_url IS NOT NULL THEN 1 END)', 'totalStoryCrawledRapidLink')
      .addSelect('COUNT(CASE WHEN story.internal_url IS NOT NULL THEN 1 END)', 'totalStoryInternalLink')
      .addSelect(
        'COUNT(CASE WHEN story.internal_url IS NULL and story.rapid_gator_url IS NOT NULL THEN 1 END)',
        'totalStoryReadyGetInternalLink',
      )
      .getRawOne();

    return queryData;
  }
}
