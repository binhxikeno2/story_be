import { ApiBaseGetListQueries } from 'shared/dto/request.dto';
import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';

export class FilterAnalyticsReqDto extends ApiBaseGetListQueries {
  @CheckApiProperty()
  dateFrom?: string;

  @CheckApiProperty()
  dateTo?: string;
}
