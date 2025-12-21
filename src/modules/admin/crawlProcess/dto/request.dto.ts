import { ApiBaseGetListQueries } from 'shared/dto/request.dto';
import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';

export class GetCrawlProcessListReqDto extends ApiBaseGetListQueries {
    @CheckApiProperty()
    search?: string;
}

export class TriggerCrawlProcessReqDto {
    @CheckApiProperty({ required: true })
    categoryId: number;

    @CheckApiProperty()
    pageFrom?: number;

    @CheckApiProperty()
    pageTo?: number;
}

