import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { convertDataToInstance, HasIdResDto, Pagination } from 'shared/dto/response.dto';

export class CategoryResDto extends HasIdResDto {
    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty()
    @Expose()
    slug: string;

    @ApiProperty()
    @Expose()
    description: string;

    @ApiProperty()
    @Expose()
    thumbnailUrl: string;

    @ApiProperty()
    @Expose()
    postCount: number;

    @ApiProperty()
    @Expose()
    unreadPostCount: number;

    constructor(data?: Partial<CategoryResDto>) {
        super();
        convertDataToInstance(data, this);
    }
}

export class CategoryListResDto extends Pagination<CategoryResDto[]> {
    @Type(() => CategoryResDto)
    items: CategoryResDto[];
}
