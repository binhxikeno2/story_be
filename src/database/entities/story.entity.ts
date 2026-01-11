import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { ChapterEntity } from './chapter.entity';

@Entity('story')
export class StoryEntity extends BaseEntity {
    @Column({
        length: 255,
        name: 'title',
    })
    public title: string;

    @Column({
        length: 500,
        name: 'media',
    })
    public media: string;

    @Column({
        length: 500,
        nullable: true,
        name: 'rapid_gator_url',
        default: null,
    })
    public rapidGatorUrl?: string;

    @Column({
        length: 500,
        nullable: true,
        name: 'internal_url',
        default: null,
    })
    public internalUrl?: string;

    @Column({
        type: 'bigint',
        name: 'chapter_id',
    })
    public chapterId: number;

    @ManyToOne(() => ChapterEntity, (chapter) => chapter.stories, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chapter_id' })
    chapter: ChapterEntity;
}
