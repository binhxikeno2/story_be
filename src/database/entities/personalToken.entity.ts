import { AfterLoad, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import * as moment from 'dayjs';

@Entity('personal_token')
export class PersonalTokenEntity extends BaseEntity {
  @Column('text')
  public token: string;

  @Column({
    name: 'expires_in',
    length: 128,
  })
  public expiresIn: string;

  @ManyToOne(() => UserEntity, (user) => user.personalTokens)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  // TODO
  @AfterLoad()
  isValidToken() {
    const created = moment(this.createdAt);
    const expired = moment(this.createdAt).add(Number(this.expiresIn), 'seconds');

    return !!this.token && created <= expired;
  }
}
