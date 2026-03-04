import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AnalyticsPostResDto {
  @ApiProperty()
  @Expose()
  totalPost: number;

  @ApiProperty()
  @Expose()
  totalPostReadyToSync: number;

  @ApiProperty()
  @Expose()
  totalPostSynced: number;
}
