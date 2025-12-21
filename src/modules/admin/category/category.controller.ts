import { Get, Query } from '@nestjs/common';
import { BaseController } from 'shared/controllers/base.controller';
import { ApiAdminController } from 'shared/decorators/apiController.decorator';
import { ApiBaseOkResponse, ApiDataWrapType } from 'shared/decorators/apiDoc.decorator';

import { CategoryService } from './category.service';
import { GetCategoryListReqDto } from './dto/request.dto';
import { CategoryListResDto } from './dto/response.dto';

@ApiAdminController({
    name: 'Category',
    authRequired: true,
})
export class CategoryController extends BaseController {
    constructor(private readonly categoryService: CategoryService) {
        super();
    }

    @Get()
    @ApiBaseOkResponse({
        summary: 'Get Category List',
        dataType: CategoryListResDto,
        wrapType: ApiDataWrapType.pagination,
    })
    public async getCategoryList(@Query() query: GetCategoryListReqDto) {
        return this.dataType(CategoryListResDto, await this.categoryService.getCategoryList(query));
    }
}
