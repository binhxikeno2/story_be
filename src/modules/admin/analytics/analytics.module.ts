import { Module } from '@nestjs/common';
import { PostRepository } from 'database/repositories/post.repository';
import { StoryRepository } from 'database/repositories/story.repository';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsPostService } from './services/analytics-post.service';

@Module({
  imports: [],
  controllers: [AnalyticsController],
  providers: [AnalyticsPostService, PostRepository, StoryRepository],
})
export class AnalyticsModule {}
