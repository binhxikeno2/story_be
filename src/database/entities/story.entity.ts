import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { ChapterEntity } from './chapter.entity';

@Entity('story')
export class StoryEntity extends BaseEntity {
    @Column({
        length: 255,
    })
    public title: string;

    @Column({
        length: 500,
    })
    public media: string;

    @Column({
        type: 'bigint',
    })
    public chapterId: number;

    @ManyToOne(() => ChapterEntity, (chapter) => chapter.stories, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chapterId' })
    chapter: ChapterEntity;
}
