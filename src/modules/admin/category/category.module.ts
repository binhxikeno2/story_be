import { Module } from '@nestjs/common';
import { CategoryRepository } from 'database/repositories/category.repository';

import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
    imports: [],
    controllers: [CategoryController],
    providers: [CategoryService, CategoryRepository],
})
export class CategoryModule { }
