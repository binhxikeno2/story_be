import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { convertDataToInstance } from 'shared/dto/response.dto';

export class IpInfoDto {
    @ApiProperty()
    @Expose()
    status?: string;

    @ApiProperty()
    @Expose()
    country?: string;

    @ApiProperty()
    @Expose()
    countryCode?: string;

    @ApiProperty()
    @Expose()
    region?: string;

    @ApiProperty()
    @Expose()
    regionName?: string;

    @ApiProperty()
    @Expose()
    city?: string;

    @ApiProperty()
    @Expose()
    zip?: string;

    @ApiProperty()
    @Expose()
    lat?: number;

    @ApiProperty()
    @Expose()
    lon?: number;

    @ApiProperty()
    @Expose()
    timezone?: string;

    @ApiProperty()
    @Expose()
    isp?: string;

    @ApiProperty()
    @Expose()
    org?: string;

    @ApiProperty()
    @Expose()
    as?: string;

    @ApiProperty()
    @Expose()
    mobile?: boolean;

    @ApiProperty()
    @Expose()
    proxy?: boolean;

    @ApiProperty()
    @Expose()
    hosting?: boolean;

    @ApiProperty()
    @Expose()
    query?: string;
}

export class SolutionDto {
    @ApiProperty()
    @Expose()
    verified?: boolean;

    @ApiProperty()
    @Expose()
    currentUrl?: string;

    @ApiProperty()
    @Expose()
    statusCode?: number;

    @ApiProperty()
    @Expose()
    userAgent?: string;

    @ApiProperty()
    @Expose()
    innerText?: string;

    @ApiProperty({ type: [String] })
    @Expose()
    cookies?: string[];

    @ApiProperty()
    @Expose()
    cookieString?: string;

    @ApiProperty()
    @Expose()
    response?: string;

    @ApiProperty({ type: Object })
    @Expose()
    responseHeaders?: Record<string, string>;

    @ApiProperty({ type: Object })
    @Expose()
    requestHeaders?: Record<string, string>;

    @ApiProperty({ type: IpInfoDto })
    @Expose()
    @Type(() => IpInfoDto)
    ipInfo?: IpInfoDto;

    @ApiProperty()
    @Expose()
    method?: string;

    @ApiProperty()
    @Expose()
    type?: string;

    constructor(data?: Partial<SolutionDto>) {
        convertDataToInstance(data, this);
    }
}

export class ScrappeyApiResponseDto {
    @ApiProperty({ type: SolutionDto })
    @Expose()
    @Type(() => SolutionDto)
    solution?: SolutionDto;

    @ApiProperty()
    @Expose()
    timeElapsed?: number;

    @ApiProperty()
    @Expose()
    data?: string;

    @ApiProperty()
    @Expose()
    session?: string;

    constructor(data?: Partial<ScrappeyApiResponseDto>) {
        convertDataToInstance(data, this);
    }
}
