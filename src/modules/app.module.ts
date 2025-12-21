import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminModule } from './admin/admin.module';
import { CategoryModule } from './admin/category/category.module';
import { CrawlProcessModule } from './admin/crawlProcess/crawlProcess.module';
import { PostModule } from './admin/post/post.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, AuthModule, AdminModule, PostModule, CategoryModule, CrawlProcessModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
