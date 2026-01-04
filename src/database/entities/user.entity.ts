import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { PersonalTokenEntity } from './personalToken.entity';

@Entity('user')
export class UserEntity extends BaseEntity {
  @Column({
    length: 128,
    unique: true,
    name: 'email',
  })
  public email: string;

  @Column({
    length: 100,
    name: 'password',
  })
  public password: string;

  @Column({
    length: 128,
    name: 'name',
  })
  public name: string;

  @OneToMany(() => PersonalTokenEntity, (personalToken) => personalToken.user)
  personalTokens: PersonalTokenEntity[];
}
