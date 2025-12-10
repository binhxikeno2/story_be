import { ExposeApiProperty } from 'shared/decorators/property.decorator';

import { ApiBaseGetListQueries } from './request.dto';
import { IsEmail } from 'class-validator';

export class UserBaseRequest extends ApiBaseGetListQueries {
  @ExposeApiProperty()
  name?: string;

  @ExposeApiProperty()
  email?: string;

  @ExposeApiProperty()
  relationship?: string[];
}
