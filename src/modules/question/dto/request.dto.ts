import { IsEmail } from 'class-validator';
import { ApiBaseGetListQueries } from 'shared/dto/request.dto';
import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';

export class QuestionReqDto extends ApiBaseGetListQueries {
  @CheckApiProperty({ type: 'string' })
  name: string;

  @CheckApiProperty({ type: 'string' })
  content: string;

  @CheckApiProperty({ type: 'string' })
  author: string;

  @CheckApiProperty({ type: 'string' })
  tags: string;

  @CheckApiProperty({ type: 'string' })
  orderBy: string;

  @CheckApiProperty({ type: 'string' })
  sort: string;
}
