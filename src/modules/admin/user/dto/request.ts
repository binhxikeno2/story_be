import { IsEmail, MaxLength } from 'class-validator';
import { UserBaseRequest } from 'shared/dto/userBase.request.dto';
import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';

export class UserReqDto extends UserBaseRequest { }

export class CreateUserReqDto {
    @CheckApiProperty({ required: true })
    @MaxLength(128)
    name: string;

    @CheckApiProperty({ required: true, })
    @IsEmail()
    @MaxLength(128)
    email: string;

    @CheckApiProperty({ required: true })
    @MaxLength(100)
    password: string;
}
