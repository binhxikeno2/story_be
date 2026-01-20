import { Injectable } from '@nestjs/common';
import { PostRepository } from 'database/repositories/post.repository';
import { logger } from 'shared/logger/app.logger';
import { generateUniqueFileName } from 'shared/utils/generate-unique-filename.util';

import { HetznerS3Service } from '../shared/services/hetzner-s3.service';
import { PublicDownloadService } from '../shared/services/public-download.service';

@Injectable()
export class UploadThumbnailPostToStorageService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly hetznerS3Service: HetznerS3Service,
    private readonly publicDownloadService: PublicDownloadService,
  ) {}

  public async uploadThumbnailPostToStorage(): Promise<void> {
    try {
      const postsWithEmptyInternalThumbnailUrl = await this.postRepository.getPostEmptyInternalThumbnailUrl();

      for (const postWithEmptyInternalThumbnailUrl of postsWithEmptyInternalThumbnailUrl) {
        if (postWithEmptyInternalThumbnailUrl.thumbnailUrl) {
          const { data, contentType } = await this.publicDownloadService.downloadFile(
            postWithEmptyInternalThumbnailUrl.thumbnailUrl,
          );
          const nameFile = generateUniqueFileName('post');

          const internalThumbnailUrl = await this.hetznerS3Service.upload({
            body: data,
            key: nameFile,
            contentType,
            acl: 'public-read',
          });

          if (internalThumbnailUrl) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            await this.postRepository.update(postWithEmptyInternalThumbnailUrl.id!, { internalThumbnailUrl });
          }
        }
      }
    } catch (error) {
      logger.error(`[UploadThumbnailPostToStorageService] Error uploading to storage: ${error}`);
    }
  }
}
