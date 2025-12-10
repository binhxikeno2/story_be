import { Transform, Type } from 'class-transformer';
import { TagEntity } from 'database/entities';
import { ExposeApiProperty } from 'shared/decorators/property.decorator';
import { BaseBaseResDto, Pagination } from 'shared/dto/response.dto';

export class QuestionResDto extends BaseBaseResDto {
  @ExposeApiProperty()
  name: string;

  @ExposeApiProperty()
  content: string;

  @ExposeApiProperty()
  thumbnailUrl: string;

  @ExposeApiProperty()
  @Transform(({ obj }) => obj?.author?.name)
  author: string;

  @ExposeApiProperty()
  @Transform(({ obj }) => obj?.tags?.map((item: TagEntity) => item?.name))
  tags: string[];
}

export class QuestionListResDto extends Pagination<QuestionResDto[]> {
  @Type(() => QuestionResDto)
  items: QuestionResDto[];
}
