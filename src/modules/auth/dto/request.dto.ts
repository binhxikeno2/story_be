import { IsEmail } from 'class-validator';
import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';

export class LoginReqDto {
  @CheckApiProperty({ required: true })
  @IsEmail()
  email: string;

  @CheckApiProperty({ required: true })
  password: string;
}

export class SignUpReqDto {
  @CheckApiProperty({ required: true })
  name: string;

  @CheckApiProperty({ required: true })
  @IsEmail()
  email: string;

  @CheckApiProperty({ required: true })
  password: string;
}

export class RenewReqDto {
  @CheckApiProperty({ required: true })
  refreshToken: string;
}
