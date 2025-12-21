import { ApiBaseGetListQueries } from 'shared/dto/request.dto';
import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';

export class GetCategoryListReqDto extends ApiBaseGetListQueries {
    @CheckApiProperty()
    search?: string;
}
