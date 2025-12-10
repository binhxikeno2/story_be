import { Body, Post } from '@nestjs/common';
import { MessageCode } from 'shared/constants/app.constant';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';

import { ContactService } from './contact.service';
import { ContactReqDto } from './dto/request.dto';
import { ContactResDto } from './dto/response.dto';

@ApiController({
  name: 'contact',
})
export class ContactController extends BaseController {
  constructor(private readonly contactService: ContactService) {
    super();
  }

  @ApiBaseOkResponse({
    summary: 'Contact',
    dataType: ContactResDto,
    messageCodes: MessageCode.badRequest,
  })
  @Post('send')
  async contact(@Body() body: ContactReqDto) {
    return this.contactService.sendContact(body);
  }
}
