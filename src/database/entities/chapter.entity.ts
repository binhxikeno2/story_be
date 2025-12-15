import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { StoryEntity } from '.';
import { BaseEntity } from './base.entity';
import { PostEntity } from './post.entity';

@Entity('chapter')
export class ChapterEntity extends BaseEntity {
    @Column({
        length: 255,
    })
    public title: string;

    @Column({
        type: 'bigint',
    })
    public postId: number;

    @ManyToOne(() => PostEntity, (post) => post.chapters, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: PostEntity;

    @OneToMany(() => StoryEntity, (story) => story.chapter, { cascade: true })
    stories: StoryEntity[];
}
