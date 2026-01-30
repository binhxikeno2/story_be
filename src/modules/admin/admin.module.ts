import { Module } from '@nestjs/common';

import { CategoryModule } from './category/category.module';
import { CrawlLinkMediaModule } from './crawl-link-media/crawl-link-media.module';
import { CrawlPostModule } from './crawl-post/crawl-post.module';
import { CrawlProcessModule } from './crawl-process/crawl-process.module';
import { PostModule } from './post/post.module';
import { ScrollJobModule } from './scroll-job/scroll-job.module';
import { SyncToWpModule } from './sync-to-wp/sync-to-wp.module';
import { UploadStoryMediaToStorageModule } from './upload-story-media-to-storage/upload-story-media-to-storage.module';
import { UploadThumbnailPostToStorageModule } from './upload-thumbnail-post-to-storage/upload-thumbnail-post-to-storage.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    UserModule,
    PostModule,
    CategoryModule,
    ScrollJobModule,
    CrawlProcessModule,
    CrawlPostModule,
    CrawlLinkMediaModule,
    UploadStoryMediaToStorageModule,
    UploadThumbnailPostToStorageModule,
    SyncToWpModule,
  ],
  controllers: [],
  providers: [],
})
export class AdminModule {}
