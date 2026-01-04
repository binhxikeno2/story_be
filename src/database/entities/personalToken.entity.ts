import * as moment from 'dayjs';
import { AfterLoad, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('personal_token')
export class PersonalTokenEntity extends BaseEntity {
  @Column({
    type: 'text',
    name: 'token',
  })
  public token: string;

  @Column({
    name: 'expires_in',
    length: 128,
  })
  public expiresIn: string;

  @ManyToOne(() => UserEntity, (user) => user.personalTokens)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @AfterLoad()
  isValidToken() {
    const now = moment();
    const expiredTime = Number(this.expiresIn) || 0;
    const expired = moment(this.createdAt).add(expiredTime, 'seconds');

    return !!this.token && (now.isBefore(expired) || now.isSame(expired));
  }
}