import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AnalyticsStoryResDto {
  @ApiProperty()
  @Expose()
  totalStory: number;

  @ApiProperty()
  @Expose()
  totalStoryCrawledRapidLink: number;

  @ApiProperty()
  @Expose()
  totalStoryInternalLink: number;

  @ApiProperty()
  @Expose()
  totalStoryReadyGetInternalLink: number;
}
