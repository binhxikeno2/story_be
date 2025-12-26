import { Body, Get, Post } from '@nestjs/common';
import { MessageCode } from 'shared/constants/app.constant';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';

import { CrawlPostService } from './crawlPost.service';
import { TriggerCrawlPostReqDto } from './dto/request.dto';
import { CrawlPostResDto } from './dto/response.dto';

@ApiAdminController({
    name: 'Crawl Post',
    authRequired: true,
})
export class CrawlPostController extends BaseController {
    constructor(private readonly crawlPostService: CrawlPostService) {
        super();
    }

    @Get()
    @ApiBaseOkResponse({
        summary: 'Get Active Crawl Post',
        dataType: CrawlPostResDto,
    })
    public async getActiveProcess() {
        return this.dataType(CrawlPostResDto, await this.crawlPostService.getActiveProcess());
    }

    @Post('trigger')
    @ApiBaseOkResponse({
        summary: 'Trigger Crawl Post',
        messageCodes: `${MessageCode.crawlInProgress}`,
    })
    public async triggerCrawlPost(@Body() body: TriggerCrawlPostReqDto) {
        return await this.crawlPostService.triggerCrawlPost(body);
    }
}

