import { Injectable } from '@nestjs/common';
import { CategoryEntity } from 'database/entities';
import { CategoryRepository } from 'database/repositories/category.repository';
import { Pagination } from 'shared/dto/response.dto';

import { GetCategoryListReqDto } from './dto/request.dto';

@Injectable()
export class CategoryService {
    constructor(private categoryRepository: CategoryRepository) { }

    public async getCategoryList(query: GetCategoryListReqDto): Promise<Pagination<CategoryEntity[]>> {
        return this.categoryRepository.getCategoryList(query);
    }

    public async getAllCategories(): Promise<CategoryEntity[]> {
        return this.categoryRepository.find();
    }
}
