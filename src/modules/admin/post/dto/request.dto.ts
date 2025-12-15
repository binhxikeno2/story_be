import { ApiBaseGetListQueries } from 'shared/dto/request.dto';
import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';

export class GetPostListReqDto extends ApiBaseGetListQueries {
    @CheckApiProperty()
    title?: string;

    @CheckApiProperty()
    category?: string;

    @CheckApiProperty({ type: 'boolean' })
    isRead?: boolean;
}

export class GetPostDetailReqDto {
    @CheckApiProperty({ required: true })
    id: number;
}
