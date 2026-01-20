import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { PostEntity } from './post.entity';

@Entity('category')
export class CategoryEntity extends BaseEntity {
  @Column({
    length: 150,
    name: 'name',
  })
  @Index({ unique: true })
  name: string;

  @Column({
    length: 180,
    name: 'slug',
  })
  @Index({ unique: true })
  slug: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'description',
  })
  description?: string;

  @Column({
    nullable: true,
    name: 'parent_id',
  })
  parentId?: number;

  @ManyToOne(() => CategoryEntity, (category) => category.children, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent?: CategoryEntity;

  @OneToMany(() => CategoryEntity, (category) => category.parent)
  children?: CategoryEntity[];

  @OneToMany(() => PostEntity, (post) => post.category)
  posts?: PostEntity[];
}
