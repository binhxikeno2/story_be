import { Body, Get, Post, Query } from '@nestjs/common';
import { MessageCode } from 'shared/constants/app.constant';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse, ApiDataWrapType } from 'shared/decorators/apiDoc.decorator';

import { GetPostDetailReqDto, GetPostListReqDto } from './dto/request.dto';
import { PostListResDto, PostResDto } from './dto/response.dto';
import { PostService } from './post.service';

@ApiAdminController({
    name: 'Post',
    authRequired: true,
})
export class PostController extends BaseController {
    constructor(private readonly postService: PostService) {
        super();
    }

    @ApiBaseOkResponse({
        summary: 'Get list of posts',
        dataType: PostListResDto,
        wrapType: ApiDataWrapType.pagination,
        messageCodes: MessageCode.badRequest,
    })
    @Get()
    async getPostList(@Query() query: GetPostListReqDto) {
        return this.dataType(PostListResDto, await this.postService.getPostList(query));
    }

    @ApiBaseOkResponse({
        summary: 'Get post detail by ID',
        dataType: PostResDto,
        messageCodes: `${MessageCode.notFound}, ${MessageCode.badRequest}`,
    })
    @Get('detail')
    async getPostDetail(@Query() query: GetPostDetailReqDto) {
        return this.dataType(PostResDto, await this.postService.getPostDetail(Number(query.id)));
    }

    @ApiBaseOkResponse({
        summary: 'Mark post as read',
        dataType: PostResDto,
        messageCodes: `${MessageCode.notFound}, ${MessageCode.badRequest}`,
    })
    @Post('make-read')
    async makeRead(@Body() body: GetPostDetailReqDto) {
        return this.dataType(PostResDto, await this.postService.makeRead(Number(body.id)));
    }
}
