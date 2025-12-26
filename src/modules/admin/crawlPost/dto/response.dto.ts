import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { CrawlStatus } from 'shared/constants/crawl.constant';
import { convertDataToInstance, HasIdResDto, Pagination } from 'shared/dto/response.dto';

export class CrawlPostResDto extends HasIdResDto {
    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty({ enum: CrawlStatus })
    @Expose()
    status: CrawlStatus;

    @ApiProperty()
    @Expose()
    startedProcessAt: Date;

    @ApiProperty()
    @Expose()
    endedProcessAt: Date;

    @ApiProperty()
    @Expose()
    @Transform(({ obj }) => obj.category?.name || null)
    categoryName: string | null;

    @ApiProperty()
    @Expose()
    numberOfPostCrawled: number;

    constructor(data?: Partial<CrawlPostResDto>) {
        super();
        convertDataToInstance(data, this);
    }
}

export class CrawlPostListResDto extends Pagination<CrawlPostResDto[]> {
    @Type(() => CrawlPostResDto)
    items: CrawlPostResDto[];
}

