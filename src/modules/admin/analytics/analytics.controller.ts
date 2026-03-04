import { Get } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';

import { AnalyticsPostResDto } from './dto/response/analytics-post.response';
import { AnalyticsStoryResDto } from './dto/response/analytics-story.response';
import { AnalyticsPostService } from './services/analytics-post.service';

@ApiAdminController({
  name: 'Analytics',
  authRequired: true,
})
export class AnalyticsController extends BaseController {
  constructor(private readonly analyticsPostService: AnalyticsPostService) {
    super();
  }

  @Get('/posts')
  @ApiBaseOkResponse({
    summary: 'Get Analytics post',
    dataType: AnalyticsPostResDto,
  })
  public async getAnalyticsPostList() {
    return this.dataType(AnalyticsPostResDto, await this.analyticsPostService.getAnalyticsPost());
  }

  @Get('/story')
  @ApiBaseOkResponse({
    summary: 'Get Analytics story',
    dataType: AnalyticsStoryResDto,
  })
  public async getAnalyticsStoryList() {
    return this.dataType(AnalyticsStoryResDto, await this.analyticsPostService.getAnalyticsStory());
  }
}
