import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';
import { ContactEntity } from 'database/entities';

@Injectable()
export class ContactRepository extends BaseRepository<ContactEntity> {
  constructor(dataSource: DataSource) {
    super(ContactEntity, dataSource);
  }
}
