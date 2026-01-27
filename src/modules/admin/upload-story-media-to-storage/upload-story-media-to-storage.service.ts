import { Injectable } from '@nestjs/common';
import { PostRepository } from 'database/repositories/post.repository';
import { StoryRepository } from 'database/repositories/story.repository';
import { logger } from 'shared/logger/app.logger';
import { generateUniqueFileName } from 'shared/utils/generate-unique-filename.util';

import { HetznerS3Service } from '../shared/services/hetzner-s3.service';
import { RapidGatorDownloadService } from '../shared/services/rapid-gator-download.service';

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

      for (const storyWithEmptyInternalUrl of storiesWithEmptyInternalUrl) {
        if (storyWithEmptyInternalUrl.rapidGatorUrl && storyWithEmptyInternalUrl.id) {
          const { data, contentType, extension } = await this.rapidGatorDownloadService.getDocumentFromRapidGator(
            storyWithEmptyInternalUrl.rapidGatorUrl,
          );

          if (!data) {
            await this.storyRepository.update(storyWithEmptyInternalUrl.id, { internalUrl: 'NOT_FOUND' });
            continue;
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
      }
    } catch (error) {
      logger.error(`[UploadStoryMediaToStorageService] Error uploading to storage: ${error}`);
    }
  }
}
