import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';

export class ApiBaseGetListQueries {
  @CheckApiProperty()
  page?: number;

  @CheckApiProperty()
  perPage?: number;
}
