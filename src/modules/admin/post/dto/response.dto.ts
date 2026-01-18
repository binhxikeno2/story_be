import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { convertDataToInstance, HasIdResDto, Pagination } from 'shared/dto/response.dto';

export class StoryPostResDto {
  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  media: string;
}

export class ChapterPostResDto {
  @ApiProperty()
  @Expose()
  title: string;

  @Type(() => StoryPostResDto)
  @ApiProperty({ type: [StoryPostResDto] })
  @Expose()
  stories: StoryPostResDto[];
}

export class PostResDto extends HasIdResDto {
  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty({ type: [String] })
  @Expose()
  @Transform(({ obj }) => obj.tags?.map((tag: any) => (typeof tag === 'string' ? tag : tag.name)) || [])
  tags: string[];

  @ApiProperty()
  @Expose()
  @Transform(({ obj }) => obj.category?.name)
  category: string;

  @ApiProperty()
  @Expose()
  thumbnailUrl: string;

  @ApiProperty()
  @Expose()
  lastUpdated: string;

  @ApiProperty()
  @Expose()
  isRead: boolean;

  @Type(() => ChapterPostResDto)
  @ApiProperty({ type: [ChapterPostResDto] })
  @Expose()
  chapters: ChapterPostResDto[];

  constructor(data?: Partial<PostResDto>) {
    super();
    convertDataToInstance(data, this);
  }
}

export class PostListItemResDto extends HasIdResDto {
  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty({ type: [String] })
  @Expose()
  @Transform(({ obj }) => obj.tags?.map((tag: any) => (typeof tag === 'string' ? tag : tag.name)) || [])
  tags: string[];

  @ApiProperty()
  @Expose()
  @Transform(({ obj }) => obj.category?.name)
  category: string;

  @ApiProperty()
  @Expose()
  thumbnailUrl: string;

  @ApiProperty()
  @Expose()
  lastUpdated: string;

  @ApiProperty()
  @Expose()
  isRead: boolean;

  constructor(data?: Partial<PostListItemResDto>) {
    super();
    convertDataToInstance(data, this);
  }
}

export class PostListResDto extends Pagination<PostListItemResDto[]> {
  @Type(() => PostListItemResDto)
  items: PostListItemResDto[];
}
