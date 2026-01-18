import { Injectable } from '@nestjs/common';
import { CrawlProcessEntity } from 'database/entities';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class CrawlProcessRepository extends BaseRepository<CrawlProcessEntity> {
  constructor(dataSource: DataSource) {
    super(CrawlProcessEntity, dataSource);
  }
}
