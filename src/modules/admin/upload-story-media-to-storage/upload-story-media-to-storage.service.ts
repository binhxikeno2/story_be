import { Injectable } from '@nestjs/common';
import { PostRepository } from 'database/repositories/post.repository';
import { StoryRepository } from 'database/repositories/story.repository';
import { logger } from 'shared/logger/app.logger';
import { generateUniqueFileName } from 'shared/utils/generate-unique-filename.util';

import { HetznerS3Service } from '../shared/services/hetzner-s3.service';
import { RapidGatorDownloadService } from '../shared/services/rapid-gator-download.service';
import { randomDelay } from '../shared/utils/delay.util';
import { CONCURRENCY_UPLOAD_STORY_MEDIA } from './upload-story-media-to-storage.constant';

@Injectable()
export class UploadStoryMediaToStorageService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly storyRepository: StoryRepository,
    private readonly hetznerS3Service: HetznerS3Service,
    private readonly rapidGatorDownloadService: RapidGatorDownloadService,
  ) {}

  // triger
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
                const peek = await this.rapidGatorDownloadService.peekRapidGatorTransfer(
                  storyWithEmptyInternalUrl.rapidGatorUrl,
                );

                if (!peek.ok) {
                  if (peek.statusCode === 403) {
                    await this.storyRepository.softDelete(storyWithEmptyInternalUrl.id);

                    return;
                  }

                  if (peek.statusCode === 401) {
                    throw new Error('Unauthorized download for rapidgator');
                  }

                  return;
                }

                const fileName = generateUniqueFileName('story', peek.extension);

                await this.rapidGatorDownloadService.chunkDownloadAndUpload(peek.downloadUrl, fileName, {
                  contentLength: peek.contentLength,
                  contentType: peek.contentType,
                });

                const internalUrl = this.hetznerS3Service.getPublicUrlForKey(fileName);

                if (internalUrl) {
                  logger.info(
                    `[UploadStoryMediaToStorageService] Successfully uploaded media for story id=${storyWithEmptyInternalUrl.id} to storage. Internal URL: ${internalUrl}`,
                  );
                  await this.storyRepository.update(storyWithEmptyInternalUrl.id, { internalUrl });
                }
              }

              await randomDelay({ min: 300, max: 100, skipLast: true });
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
