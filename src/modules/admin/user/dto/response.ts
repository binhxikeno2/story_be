import { Type } from "class-transformer";
import { ExposeApiProperty } from "shared/decorators/property.decorator";
import { BaseBaseResDto, Pagination } from "shared/dto/response.dto";

export class UserResDto extends BaseBaseResDto {
    @ExposeApiProperty()
    name: string;

    @ExposeApiProperty()
    email: string;
}

export class UserListResDto extends Pagination<UserResDto[]> {
    @Type(() => UserResDto)
    items: UserResDto[]
}