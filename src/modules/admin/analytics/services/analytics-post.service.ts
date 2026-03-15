import { Injectable } from '@nestjs/common';
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

    const queryGetPostReadyToSync = this.postRepository.queryPostReadyToSync();
    const totalPostReadyToSync = await queryGetPostReadyToSync.getCount();

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

    const totalStorySynced = await this.storyRepository
      .createQueryBuilder('story')
      .innerJoin('chapter', 'chapter', 'chapter.id = story.chapter_id')
      .innerJoin('post', 'post', 'post.id = chapter.post_id')
      .where('post.3happy_guy_post_id IS NOT NULL')
      .getCount();

    return {
      totalStory,
      totalStoryCrawledRapidLink,
      totalStoryInternalLink,
      totalStoryReadyGetInternalLink,
      totalStorySynced,
    };
  }
}
