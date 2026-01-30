import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

import { ChapterEntity } from '.';
import { BaseEntity } from './base.entity';
import { CategoryEntity } from './category.entity';
import { TagEntity } from './tag.entity';

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

  @ManyToMany(() => TagEntity, (tag) => tag.posts, { cascade: true, nullable: true })
  @JoinTable({
    name: 'post_tag',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  public tags?: TagEntity[];

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
    length: 500,
    nullable: true,
    name: 'internal_thumbnail_url',
  })
  public internalThumbnailUrl: string;

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

  @Column({
    nullable: true,
    name: '3happy_guy_post_id',
  })
  threeHappyGuyPostId?: number;

  @OneToMany(() => ChapterEntity, (chapter) => chapter.post, { cascade: true })
  chapters: ChapterEntity[];
}
