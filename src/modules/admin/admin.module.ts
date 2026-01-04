import { Module } from '@nestjs/common';

import { CategoryModule } from './category/category.module';
import { CrawlCategoryModule } from './crawl-category/crawl-category.module';
import { CrawlCategoryDetailModule } from './crawl-category-detail/crawl-category-detail.module';
import { CrawlMediaModule } from './crawl-media/crawl-media.module';
import { CrawlPostModule } from './crawl-post/crawl-post.module';
import { PostModule } from './post/post.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule, PostModule, CategoryModule, CrawlCategoryModule, CrawlCategoryDetailModule, CrawlPostModule, CrawlMediaModule],
  controllers: [],
  providers: [],
})
export class AdminModule { }
