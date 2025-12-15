import { Injectable } from '@nestjs/common';
import { PostEntity } from 'database/entities';
import { PostRepository } from 'database/repositories/post.repository';
import { MessageCode } from 'shared/constants/app.constant';
import { Pagination } from 'shared/dto/response.dto';
import { ApiNotFoundException } from 'shared/types';

import { GetPostListReqDto } from './dto/request.dto';

@Injectable()
export class PostService {
    constructor(private postRepository: PostRepository) { }

    public async getPostList(query: GetPostListReqDto): Promise<Pagination<PostEntity[]>> {
        return this.postRepository.getPostList(query);
    }

    public async getPostDetail(id: number): Promise<PostEntity> {
        const post = await this.postRepository.getPostDetail(id);

        if (!post) {
            throw new ApiNotFoundException(MessageCode.notFound, 'Post not found');
        }

        return post;
    }

    public async makeRead(id: number): Promise<void> {
        const post = await this.postRepository.findOne({ where: { id } });

        if (!post) {
            throw new ApiNotFoundException(MessageCode.notFound, 'Post not found');
        }

        if (post.isRead) {
            throw new ApiNotFoundException(MessageCode.badRequest, 'Post is already marked as read');
        }

        post.isRead = true;

        this.postRepository.save(post);
    }
}
