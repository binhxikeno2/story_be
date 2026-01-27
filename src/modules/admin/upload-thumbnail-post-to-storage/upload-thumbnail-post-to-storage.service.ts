import { Injectable } from '@nestjs/common';
import { PostRepository } from 'database/repositories/post.repository';
import { logger } from 'shared/logger/app.logger';
import { generateUniqueFileName } from 'shared/utils/generate-unique-filename.util';

import { HetznerS3Service } from '../shared/services/hetzner-s3.service';
import { PublicDownloadService } from '../shared/services/public-download.service';
import { CONCURRENCY_UPLOAD_THUMBNAIL_POST } from './upload-thumbnail-post-to-storage.constant';

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

      const batchCount = Math.ceil(postsWithEmptyInternalThumbnailUrl.length / CONCURRENCY_UPLOAD_THUMBNAIL_POST);
      const batches = Array.from({ length: batchCount }, (_, i) =>
        postsWithEmptyInternalThumbnailUrl.slice(
          i * CONCURRENCY_UPLOAD_THUMBNAIL_POST,
          (i + 1) * CONCURRENCY_UPLOAD_THUMBNAIL_POST,
        ),
      );

      for (const batch of batches) {
        await Promise.all(
          batch.map(async (postWithEmptyInternalThumbnailUrl) => {
            try {
              if (postWithEmptyInternalThumbnailUrl.thumbnailUrl) {
                const { data, contentType } = await this.publicDownloadService.downloadFile(
                  postWithEmptyInternalThumbnailUrl.thumbnailUrl,
                );

                if (!data) {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  await this.postRepository.update(postWithEmptyInternalThumbnailUrl.id!, {
                    internalThumbnailUrl: 'NOT_FOUND',
                  });

                  return;
                }

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
            } catch (error) {
              logger.error(
                `[UploadThumbnailPostToStorageService] Error processing post id=${postWithEmptyInternalThumbnailUrl.id}: ${error}`,
              );
            }
          }),
        );
      }
    } catch (error) {
      logger.error(`[UploadThumbnailPostToStorageService] Error uploading to storage: ${error}`);
    }
  }
}
