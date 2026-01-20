import { Injectable } from '@nestjs/common';
import {
  ChapterEntity,
  CrawlProcessDetailEntity,
  CrawlProcessDetailStatus,
  PostEntity,
  StoryEntity,
  TagEntity,
} from 'database/entities';
import { CategoryRepository } from 'database/repositories/category.repository';
import { CrawlProcessDetailRepository } from 'database/repositories/crawlProcessDetail.repository';
import { TagRepository } from 'database/repositories/tag.repository';
import { logger } from 'shared/logger/app.logger';
import { DataSource } from 'typeorm';

import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { parsePostInfoFromHtml, PostInfo } from '../shared/utils/parser-post.utils';
import { CONCURRENCY_CRAWL_POST } from './crawl-post.constant';

@Injectable()
export class CrawlPostService {
  constructor(
    private readonly crawlProcessDetailRepository: CrawlProcessDetailRepository,
    private readonly thirdPartyApiService: ThirdPartyApiService,
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagRepository,
    private readonly dataSource: DataSource,
  ) {}

  async onCrawlPost(): Promise<void> {
    const crawlProcessDetails = await this.crawlProcessDetailRepository.getCrawlProcessDetailWithStatus([
      CrawlProcessDetailStatus.CREATED,
      CrawlProcessDetailStatus.FAILED,
    ]);

    if (crawlProcessDetails.length === 0) {
      return;
    }

    const batchCount = Math.ceil(crawlProcessDetails.length / CONCURRENCY_CRAWL_POST);
    const batches = Array.from({ length: batchCount }, (_, i) =>
      crawlProcessDetails.slice(i * CONCURRENCY_CRAWL_POST, (i + 1) * CONCURRENCY_CRAWL_POST),
    );

    for (const batch of batches) {
      await Promise.all(batch.map((crawlProcessDetail) => this.onCrawlPostDetail(crawlProcessDetail)));
    }
  }

  async onCrawlPostDetail(crawlProcessDetail: CrawlProcessDetailEntity): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { url } = crawlProcessDetail;

      const { html } = await this.thirdPartyApiService.fetchHtml(url);

      if (!html) {
        throw new Error('HTML is empty');
      }

      const postInfo = parsePostInfoFromHtml(html);

      if (!postInfo) {
        throw new Error('Post info is empty');
      }

      const category = await this.categoryRepository.getOrCreateCategory({
        name: postInfo.category?.title,
        slug: postInfo.category?.slug,
      });
      const tags = await this.tagRepository.getOrCreateTags(postInfo.tags || []);

      const post = await this.createPost(queryRunner, postInfo, category?.id, tags);
      await this.createChaptersAndStories(queryRunner, post.id, postInfo.chapters || []);

      await queryRunner.commitTransaction();

      await this.crawlProcessDetailRepository.setDone(crawlProcessDetail.id);
      await this.crawlProcessDetailRepository.linkCrawlProcessDetailToPost(crawlProcessDetail.id, post.id);

      logger.info(`Crawl post detail ${crawlProcessDetail.title} done`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.crawlProcessDetailRepository.setError(crawlProcessDetail.id, error.message);
    } finally {
      await queryRunner.release();
    }
  }

  private async createPost(
    queryRunner: any,
    postInfo: PostInfo,
    categoryId: number | undefined,
    tags: TagEntity[],
  ): Promise<PostEntity> {
    const post = queryRunner.manager.getRepository(PostEntity).create({
      title: postInfo.title,
      description: postInfo.description,
      thumbnailUrl: postInfo.thumbnailUrl,
      lastUpdated: postInfo.lastUpdated,
      isRead: postInfo.isRead,
      categoryId,
      tags,
    });

    return queryRunner.manager.getRepository(PostEntity).save(post);
  }

  private async createChaptersAndStories(
    queryRunner: any,
    postId: number,
    chapters: PostInfo['chapters'],
  ): Promise<void> {
    if (!chapters || chapters.length === 0) {
      return;
    }

    const chapterEntities = chapters.map((chapterInfo) =>
      queryRunner.manager.getRepository(ChapterEntity).create({
        title: chapterInfo.title,
        postId,
      }),
    );

    const savedChapters = await queryRunner.manager.getRepository(ChapterEntity).save(chapterEntities);

    const allStories: Array<{ name: string; media: string; rapidGatorUrl: null; chapterId: number }> = [];

    savedChapters.forEach((savedChapter: ChapterEntity, index: number) => {
      const chapterInfo = chapters[index];
      if (chapterInfo.stories && chapterInfo.stories.length > 0) {
        chapterInfo.stories.forEach((story) => {
          allStories.push({
            name: story.name,
            media: story.media,
            rapidGatorUrl: story.rapidGatorUrl,
            chapterId: savedChapter.id,
          });
        });
      }
    });

    if (allStories.length > 0) {
      await this.createStories(queryRunner, allStories);
    }
  }

  private async createStories(
    queryRunner: any,
    stories: Array<{ name: string; media: string; rapidGatorUrl: null; chapterId: number }>,
  ): Promise<void> {
    if (!stories || stories.length === 0) {
      return;
    }

    const storyEntities = stories.map((story) =>
      queryRunner.manager.getRepository(StoryEntity).create({
        title: story.name,
        media: story.media,
        rapidGatorUrl: story.rapidGatorUrl || null,
        chapterId: story.chapterId,
      }),
    );

    await queryRunner.manager.getRepository(StoryEntity).save(storyEntities);
  }
}
