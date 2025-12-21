import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { ChapterEntity } from '.';
import { BaseEntity } from './base.entity';
import { CategoryEntity } from './category.entity';

@Entity('post')
export class PostEntity extends BaseEntity {
    @Column({
        length: 255,
    })
    public title: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    public description: string;

    @Column({
        type: 'simple-array',
        nullable: true,
    })
    public tags: string[];

    @Column({ nullable: true })
    public categoryId?: number;

    @ManyToOne(() => CategoryEntity, (category) => category.posts, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'categoryId' })
    public category?: CategoryEntity;

    @Column({
        length: 500,
        nullable: true,
    })
    public thumbnailUrl: string;

    @Column({
        type: 'timestamp',
        nullable: true,
    })
    public lastUpdated: Date;

    @Column({
        type: 'boolean',
        default: false,
    })
    public isRead: boolean;

    @OneToMany(() => ChapterEntity, (chapter) => chapter.post, { cascade: true })
    chapters: ChapterEntity[];
}
