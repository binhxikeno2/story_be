import { Body, Get, Post } from '@nestjs/common';
import { MessageCode } from 'shared/constants/app.constant';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse } from 'shared/decorators/apiDoc.decorator';

import { CrawlProcessService } from './crawlProcess.service';
import { TriggerCrawlProcessReqDto } from './dto/request.dto';
import { CrawlProcessResDto } from './dto/response.dto';

@ApiAdminController({
    name: 'Crawl Process',
    authRequired: true,
})
export class CrawlProcessController extends BaseController {
    constructor(private readonly crawlProcessService: CrawlProcessService) {
        super();
    }

    @Get()
    @ApiBaseOkResponse({
        summary: 'Get Active Crawl Process',
        dataType: CrawlProcessResDto,
    })
    public async getActiveProcess() {
        return this.dataType(CrawlProcessResDto, await this.crawlProcessService.getActiveProcess());
    }

    @Post('trigger')
    @ApiBaseOkResponse({
        summary: 'Trigger Crawl Process',
        messageCodes: `${MessageCode.crawlInProgress}`,
    })
    public async triggerCrawlProcess(@Body() body: TriggerCrawlProcessReqDto) {
        return await this.crawlProcessService.triggerCrawlProcess(body);
    }
}

