import { Injectable } from '@nestjs/common';
import { PostRepository } from 'database/repositories/post.repository';
import { StoryRepository } from 'database/repositories/story.repository';
import { logger } from 'shared/logger/app.logger';
import { generateUniqueFileName } from 'shared/utils/generate-unique-filename.util';

import { HetznerS3Service } from '../shared/services/hetzner-s3.service';
import { RapidGatorDownloadService } from '../shared/services/rapid-gator-download.service';
import { CONCURRENCY_UPLOAD_STORY_MEDIA } from './upload-story-media-to-storage.constant';

@Injectable()
export class UploadStoryMediaToStorageService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly storyRepository: StoryRepository,
    private readonly hetznerS3Service: HetznerS3Service,
    private readonly rapidGatorDownloadService: RapidGatorDownloadService,
  ) {}

  public async uploadStoryMediaToStorage(): Promise<void> {
    try {
      const storiesWithEmptyInternalUrl = await this.storyRepository.getStoriesWithEmptyInternalUrl();

      const batchCount = Math.ceil(storiesWithEmptyInternalUrl.length / CONCURRENCY_UPLOAD_STORY_MEDIA);
      const batches = Array.from({ length: batchCount }, (_, i) =>
        storiesWithEmptyInternalUrl.slice(i * CONCURRENCY_UPLOAD_STORY_MEDIA, (i + 1) * CONCURRENCY_UPLOAD_STORY_MEDIA),
      );

      for (const batch of batches) {
        await Promise.all(
          batch.map(async (storyWithEmptyInternalUrl) => {
            try {
              if (storyWithEmptyInternalUrl.rapidGatorUrl && storyWithEmptyInternalUrl.id) {
                const { data, contentType, extension } = await this.rapidGatorDownloadService.getDocumentFromRapidGator(
                  storyWithEmptyInternalUrl.rapidGatorUrl,
                );

                if (!data) {
                  await this.storyRepository.update(storyWithEmptyInternalUrl.id, { internalUrl: '' });

                  return;
                }

                const fileName = generateUniqueFileName('story', extension);

                const internalUrl = await this.hetznerS3Service.upload({
                  body: data,
                  key: fileName,
                  contentType,
                  acl: 'public-read',
                });

                if (internalUrl) {
                  await this.storyRepository.update(storyWithEmptyInternalUrl.id, { internalUrl });
                }
              }
            } catch (error) {
              logger.error(
                `[UploadStoryMediaToStorageService] Error processing story id=${storyWithEmptyInternalUrl.id}: ${error}`,
              );
            }
          }),
        );
      }
    } catch (error) {
      logger.error(`[UploadStoryMediaToStorageService] Error uploading to storage: ${error}`);
    }
  }
}
