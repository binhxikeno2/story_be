import { ExposeApiProperty } from 'shared/decorators/property.decorator';

import { ApiBaseGetListQueries } from './request.dto';

export class UserBaseRequest extends ApiBaseGetListQueries {
  @ExposeApiProperty()
  name?: string;

  @ExposeApiProperty()
  email?: string;

  @ExposeApiProperty()
  relationship?: string[];
}
