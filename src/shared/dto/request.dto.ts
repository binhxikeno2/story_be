import { Transform } from 'class-transformer';
import { ToBooleanOrUndefined } from 'shared/decorators/boolean.decorator';
import { ExposeApiProperty } from 'shared/decorators/property.decorator';

export class ApiBaseGetListQueries {
  @ExposeApiProperty()
  @Transform(({ value }) => (value ? value : 1))
  page?: number;

  @ExposeApiProperty()
  @Transform(({ value }) => (value ? value : 20))
  perPage?: number;

  @ExposeApiProperty({ description: 'Includes soft-deleted items in result if deleted=true' })
  @ToBooleanOrUndefined()
  deleted?: boolean;
}
