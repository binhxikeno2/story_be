import { Injectable } from '@nestjs/common';
import { PersonalTokenEntity } from 'database/entities';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class PersonalTokenRepository extends BaseRepository<PersonalTokenEntity> {
  constructor(dataSource: DataSource) {
    super(PersonalTokenEntity, dataSource);
  }

  public async getPersonalTokenUser(token: string, userId: number): Promise<PersonalTokenEntity | null> {
    return this.findOne({ where: { token, user: { id: userId } }, relations: ['user'] });
  }
}
