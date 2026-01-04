import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { ChapterEntity } from '.';
import { BaseEntity } from './base.entity';
import { CategoryEntity } from './category.entity';

@Entity('post')
export class PostEntity extends BaseEntity {
    @Column({
        length: 255,
        name: 'title',
    })
    public title: string;

    @Column({
        type: 'text',
        nullable: true,
        name: 'description',
    })
    public description: string;

    @Column({
        type: 'simple-array',
        nullable: true,
        name: 'tags',
    })
    public tags: string[];

    @Column({
        nullable: true,
        name: 'category_id',
    })
    public categoryId?: number;

    @ManyToOne(() => CategoryEntity, (category) => category.posts, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'category_id' })
    public category?: CategoryEntity;

    @Column({
        length: 500,
        nullable: true,
        name: 'thumbnail_url',
    })
    public thumbnailUrl: string;

    @Column({
        type: 'timestamp',
        nullable: true,
        name: 'last_updated',
    })
    public lastUpdated: Date;

    @Column({
        type: 'boolean',
        default: false,
        name: 'is_read',
    })
    public isRead: boolean;

    @OneToMany(() => ChapterEntity, (chapter) => chapter.post, { cascade: true })
    chapters: ChapterEntity[];
}
