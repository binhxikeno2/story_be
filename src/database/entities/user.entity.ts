import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PersonalTokenEntity } from './personalToken.entity';
import { QuestionEntity } from './question.entity';

@Entity('user')
export class UserEntity extends BaseEntity {
  @Column({
    length: 128,
    unique: true,
  })
  public email: string;

  @Column({
    length: 100,
  })
  public password: string;

  @Column({
    length: 128,
  })
  public name: string;

  @OneToMany(() => PersonalTokenEntity, (personalToken) => personalToken.user)
  personalTokens: PersonalTokenEntity[];

  @OneToMany(() => QuestionEntity, (question) => question.author)
  questions: QuestionEntity[];
}
