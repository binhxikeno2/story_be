import { Get, Query } from '@nestjs/common';
import { MessageCode } from 'shared/constants/app.constant';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';

import { QuestionReqDto } from './dto/request.dto';
import { QuestionListResDto } from './dto/response.dto';
import { QuestionService } from './question.service';

@ApiController({
  name: 'question',
})
export class QuestionController extends BaseController {
  constructor(private readonly questionService: QuestionService) {
    super();
  }

  @ApiBaseOkResponse({
    summary: 'Question',
    dataType: QuestionListResDto,
    messageCodes: MessageCode.badToken,
  })
  @Get()
  async searchQuestion(@Query() body: QuestionReqDto) {
    return this.dataType(QuestionListResDto, await this.questionService.searchQuestion(body));
  }
}
