import { Module } from '@nestjs/common';
import { PostRepository } from 'database/repositories/post.repository';

import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
    imports: [],
    controllers: [PostController],
    providers: [PostService, PostRepository],
})
export class PostModule { }
