import { ExposeApiProperty } from 'shared/decorators/property.decorator';

export class LoginResDto {
  @ExposeApiProperty()
  refreshToken: string;

  @ExposeApiProperty()
  accessToken: string;
}

export class PayloadTokenType {
  email?: string;
}
