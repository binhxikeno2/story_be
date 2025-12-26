import { ApiBaseGetListQueries } from 'shared/dto/request.dto';
import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';

export class GetCrawlPostListReqDto extends ApiBaseGetListQueries {
    @CheckApiProperty()
    search?: string;
}

export class TriggerCrawlPostReqDto {
    @CheckApiProperty({ required: true })
    categoryId: number;

    @CheckApiProperty({ required: true })
    pageFrom: number;

    @CheckApiProperty({ required: true })
    pageTo: number;
}

