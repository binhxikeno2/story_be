import { Body, Post } from '@nestjs/common';
import { MessageCode } from 'shared/constants/app.constant';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';

import { AuthService } from './auth.service';
import { LoginReqDto, RenewReqDto, SignUpReqDto } from './dto/request.dto';
import { LoginResDto } from './dto/response.dto';

@ApiController({
  name: 'Auth',
})
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @ApiBaseOkResponse({
    summary: 'Login',
    dataType: LoginResDto,
    messageCodes: MessageCode.wrongMailOrPassword,
  })
  @Post('sign-in')
  async signIn(@Body() body: LoginReqDto) {
    return this.dataType(LoginResDto, await this.authService.signIn(body));
  }

  @ApiBaseOkResponse({
    summary: 'Register',
    messageCodes: MessageCode.userExisted,
  })
  @Post('sign-up')
  async signUp(@Body() body: SignUpReqDto) {
    return this.authService.signUp(body);
  }

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
