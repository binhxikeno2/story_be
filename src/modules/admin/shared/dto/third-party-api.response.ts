import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { convertDataToInstance } from 'shared/dto/response.dto';

export class ThirdPartyApiResponseDto {
  @ApiProperty()
  @Expose()
  html?: string;

  @ApiProperty()
  @Expose()
  currentUrl?: string;

  constructor(data?: Partial<ThirdPartyApiResponseDto>) {
    convertDataToInstance(data, this);
  }
}
