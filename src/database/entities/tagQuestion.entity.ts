import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { QuestionEntity } from './question.entity';
import { TagEntity } from './tag.entity';

@Entity('tag_question')
export class TagQuestionEntity extends BaseEntity {
  @ManyToOne(() => QuestionEntity, (question) => question.tags)
  @JoinColumn({ name: 'question_id' })
  question: QuestionEntity;

  @ManyToOne(() => TagEntity, (tag) => tag.questions)
  @JoinColumn({ name: 'tag_id' })
  tag: TagEntity;
}
