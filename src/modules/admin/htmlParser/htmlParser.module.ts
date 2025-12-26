import { Module } from '@nestjs/common';

import { HtmlParserService } from './htmlParser.service';

@Module({
    providers: [HtmlParserService],
    exports: [HtmlParserService],
})
export class HtmlParserModule { }

