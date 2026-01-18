import { Module } from '@nestjs/common';

import { CategoryModule } from './category/category.module';
import { CrawlProcessModule } from './crawl-process/crawl-process.module';
import { PostModule } from './post/post.module';
import { ScrollJobModule } from './scroll-job/scroll-job.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule, PostModule, CategoryModule, ScrollJobModule, CrawlProcessModule],
  controllers: [],
  providers: [],
})
export class AdminModule {}
