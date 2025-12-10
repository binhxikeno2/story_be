import { Body, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { MessageCode } from 'shared/constants/app.constant';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';

import { CreateUserReqDto, UserReqDto } from './dto/request';
import { UserListResDto, UserResDto } from './dto/response';
import { UserService } from './user.service';
import { AdminController } from 'shared/controllers/admin.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';

@ApiAdminController({
  name: 'user',
})
export class UserController extends AdminController {
  constructor(private readonly userService: UserService) {
    super();
  }

  @ApiBaseOkResponse({
    summary: 'User',
    dataType: UserListResDto,
    messageCodes: MessageCode.badRequest,
  })
  @Get('/show')
  async getUser(@Query() query: UserReqDto) {
    return this.dataType(UserListResDto, await this.userService.getUsers(query));
  }

  @ApiBaseOkResponse({
    summary: 'Create User',
    dataType: UserResDto,
    messageCodes: MessageCode.badRequest,
  })
  @Post('/create')
  async createUser(@Body() body: CreateUserReqDto) {
    return this.dataType(UserResDto, await this.userService.createUser(body));
  }

  @ApiBaseOkResponse({
    summary: 'Delete User',
    messageCodes: MessageCode.badRequest,
  })
  @Delete('/:id')
  async destroy(@Param('id') id: number) {
    return this.userService.destroyUser(Number(id));
  }
}
