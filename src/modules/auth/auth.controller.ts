import { Body, Post } from '@nestjs/common';
import { MessageCode } from 'shared/constants/app.constant';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';
import { Public } from 'shared/decorators/public.decorator';

import { AuthService } from './auth.service';
import { LoginReqDto, RenewReqDto, SignUpReqDto } from './dto/request.dto';
import { LoginResDto } from './dto/response.dto';

@ApiAdminController({
  name: 'Auth',
  authRequired: true,
})
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @Public() // Skip authentication cho endpoint này
  @ApiBaseOkResponse({
    summary: 'Login',
    dataType: LoginResDto,
    messageCodes: MessageCode.wrongMailOrPassword,
  })
  @Post('sign-in')
  async signIn(@Body() body: LoginReqDto) {
    return this.dataType(LoginResDto, await this.authService.signIn(body));
  }

  @Public() // Skip authentication cho endpoint này
  @ApiBaseOkResponse({
    summary: 'Register',
    messageCodes: MessageCode.userExisted,
  })
  @Post('sign-up')
  async signUp(@Body() body: SignUpReqDto) {
    return this.authService.signUp(body);
  }

  @Public() // Skip authentication cho endpoint này
  @ApiBaseOkResponse({
    summary: 'Renew Token',
    dataType: LoginResDto,
    messageCodes: MessageCode.invalidToken,
  })
  @Post('renew-token')
  async renewToken(@Body() body: RenewReqDto) {
    return this.authService.renewToken(body);
  }
}
