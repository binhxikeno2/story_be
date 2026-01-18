import { Injectable } from '@nestjs/common';
import { CrawlProcessDetailEntity } from 'database/entities';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class CrawlProcessDetailRepository extends BaseRepository<CrawlProcessDetailEntity> {
  constructor(dataSource: DataSource) {
    super(CrawlProcessDetailEntity, dataSource);
  }
}
