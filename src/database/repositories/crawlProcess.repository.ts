import { Injectable } from '@nestjs/common';
import { CrawlProcessEntity, CrawlProcessRange, CrawlProcessStats, CrawlProcessStatus } from 'database/entities';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class CrawlProcessRepository extends BaseRepository<CrawlProcessEntity> {
  constructor(dataSource: DataSource) {
    super(CrawlProcessEntity, dataSource);
  }

  public async createCrawlProcess(data?: Partial<CrawlProcessEntity>): Promise<CrawlProcessEntity> {
    return this.getRepository().save({ ...data, status: CrawlProcessStatus.CREATED });
  }

  public async setRunningProcess(id: number): Promise<void> {
    await this.getRepository().update(id, { status: CrawlProcessStatus.RUNNING });
  }

  public async setStats(id: number, stats: Partial<CrawlProcessStats>): Promise<void> {
    await this.getRepository().update(id, { stats });
  }

  public async setRange(id: number, range: Partial<CrawlProcessRange>): Promise<void> {
    await this.getRepository().update(id, { range });
  }
}
