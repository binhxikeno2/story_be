import { Column, Entity, Index, ManyToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { PostEntity } from './post.entity';

@Entity('tag')
export class TagEntity extends BaseEntity {
  @Column({
    length: 255,
    name: 'name',
  })
  @Index({ unique: true })
  public name: string;

  @ManyToMany(() => PostEntity, (post) => post.tags)
  public posts: PostEntity[];
}
