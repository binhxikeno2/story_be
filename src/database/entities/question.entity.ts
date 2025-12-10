import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import { TagEntity } from './tag.entity';

@Entity('question')
export class QuestionEntity extends BaseEntity {
  @Column({
    length: 255,
  })
  public name: string;

  @Column('text')
  public content: string;

  @Column({
    name: 'thumbnail-url',
    length: 255,
  })
  public thumbnailUrl: string;

  @ManyToOne(() => UserEntity, (user) => user.questions)
  @JoinColumn({ name: 'author_id', referencedColumnName: 'id' })
  author: UserEntity;

  @ManyToMany(() => TagEntity, (tag) => tag.questions)
  @JoinTable({
    name: 'tag_question',
    joinColumn: { name: 'question_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: TagEntity[];
}
