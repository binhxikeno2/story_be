import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminModule } from './admin/admin.module';
import { CategoryModule } from './admin/category/category.module';
import { CrawlPostModule } from './admin/crawlPost/crawlPost.module';
import { PostModule } from './admin/post/post.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, AuthModule, AdminModule, PostModule, CategoryModule, CrawlPostModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
