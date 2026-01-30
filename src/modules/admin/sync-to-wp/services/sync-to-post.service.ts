import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostEntity } from 'database/entities';
import { PostRepository } from 'database/repositories/post.repository';
import { logger } from 'shared/logger/app.logger';

interface WordPressStory {
  title: string;
  media: string;
}

interface WordPressChapter {
  title: string;
  stories: WordPressStory[];
}

interface WordPressPost {
  title: string;
  description: string;
  categoryId: number;
  tagIds: number[];
  thumbnailUrl: string;
  myId: number;
  chapters: WordPressChapter[];
}

interface WordPressPostResponse {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  tagIds: number[];
  thumbnailUrl: string;
  myId: number;
  existed: boolean;
}

interface WordPressApiResponse {
  success: boolean;
  created: WordPressPostResponse[];
  count: number;
}

@Injectable()
export class SyncToPostService {
  constructor(private readonly postRepository: PostRepository, private readonly configService: ConfigService) {}

  async syncPost(): Promise<void> {
    try {
      const posts = await this.postRepository.getPostsToSync();

      if (posts.length === 0) {
        logger.info('[SyncToPostService] No posts to sync');

        return;
      }

      const BATCH_SIZE = 50;
      const batches = this.chunkArray(posts, BATCH_SIZE);
      const totalBatches = batches.length;

      logger.info(`[SyncToPostService] Processing ${posts.length} posts in ${totalBatches} batches`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        const formattedPosts = this.formatPostsForWordPress(batch);
        const apiResponse = await this.createPostsInWordPress(formattedPosts);
        await this.updatePostsWithWordPressIds(batch, apiResponse.created);
      }

      logger.info('[SyncToPostService] Sync completed successfully');
    } catch (error) {
      logger.error(`[SyncToPostService] Error syncing posts: ${error.message}`, error.stack);
      throw error;
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }

    return chunks;
  }

  private formatPostsForWordPress(posts: PostEntity[]): WordPressPost[] {
    return posts.map((post) => ({
      title: post.title,
      description: post.description || '',
      categoryId: post.category?.threeHappyGuyCategoryId || 0,
      tagIds: (post.tags || [])
        .map((tag) => tag.threeHappyGuyTagId)
        .filter((id): id is number => id != null && id !== undefined),
      thumbnailUrl: post.internalThumbnailUrl || '',
      myId: post.id,
      chapters: (post.chapters || [])
        .map((chapter) => ({
          title: chapter.title,
          stories: (chapter.stories || [])
            .filter((story) => story.internalUrl != null && story.internalUrl !== '')
            .map((story) => ({
              title: story.title,
              media: story.internalUrl || '',
            })),
        }))
        .filter((chapter) => chapter.stories.length > 0),
    }));
  }

  private getApiConfig(): { apiUrl: string; apiKey: string } {
    const apiUrl = this.configService.get<string>('API_WP_URL');
    const apiKey = this.configService.get<string>('X_API_KEY_WP');

    if (!apiUrl || !apiKey) {
      throw new Error('API_WP_URL or X_API_KEY_WP is not configured');
    }

    return { apiUrl, apiKey };
  }

  private async createPostsInWordPress(posts: WordPressPost[]): Promise<WordPressApiResponse> {
    const { apiUrl, apiKey } = this.getApiConfig();

    const response = await fetch(`${apiUrl}/wp-json/magazine/v1/posts/create`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        posts,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[SyncToPostService] API returned error status ${response.status}: ${errorText}`);
      throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
    }

    const data: WordPressApiResponse = await response.json();

    if (!data.success) {
      throw new Error('WordPress API returned success: false');
    }

    logger.info(`[SyncToPostService] Successfully created ${data.count} posts`);

    return data;
  }

  private buildPostMap(posts: PostEntity[], createdPosts: WordPressPostResponse[]): Map<number, number> {
    const postMap = new Map<number, number>();

    createdPosts.forEach((createdPost) => {
      postMap.set(createdPost.myId, createdPost.id);
    });

    return postMap;
  }

  private async updatePostsWithWordPressIds(posts: PostEntity[], createdPosts: WordPressPostResponse[]): Promise<void> {
    const postMap = this.buildPostMap(posts, createdPosts);

    for (const post of posts) {
      const wpPostId = postMap.get(post.id);
      if (wpPostId) {
        await this.postRepository.update({ id: post.id }, { threeHappyGuyPostId: wpPostId });
        logger.info(`[SyncToPostService] Updated post ${post.title} with WP ID: ${wpPostId}`);
      }
    }
  }
}
