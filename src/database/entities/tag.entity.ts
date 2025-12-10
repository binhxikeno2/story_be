import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { QuestionEntity } from './question.entity';

@Entity('tag')
export class TagEntity extends BaseEntity {
  @Column({
    length: 255,
  })
  public name: string;

  @Column({
    length: 255,
    nullable: false,
  })
  public preview: string;

  @ManyToMany(() => QuestionEntity, (question) => question.tags)
  questions: QuestionEntity[];
}
