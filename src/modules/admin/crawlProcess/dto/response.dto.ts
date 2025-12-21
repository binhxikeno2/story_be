import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { CrawlStatus } from 'database/entities/crawlProcess.entity';
import { convertDataToInstance, HasIdResDto, Pagination } from 'shared/dto/response.dto';

export class CrawlProcessResDto extends HasIdResDto {
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

    constructor(data?: Partial<CrawlProcessResDto>) {
        super();
        convertDataToInstance(data, this);
    }
}

export class CrawlProcessListResDto extends Pagination<CrawlProcessResDto[]> {
    @Type(() => CrawlProcessResDto)
    items: CrawlProcessResDto[];
}

