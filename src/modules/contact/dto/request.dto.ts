import { IsEmail } from 'class-validator';
import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';

export class ContactReqDto {
  @CheckApiProperty({ required: true })
  name: string;

  @CheckApiProperty({ required: true })
  @IsEmail()
  email: string;

  @CheckApiProperty({ required: true })
  subject: string;

  @CheckApiProperty({ required: true })
  message: string;
}
