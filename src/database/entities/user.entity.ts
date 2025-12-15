import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { PersonalTokenEntity } from './personalToken.entity';

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
}
