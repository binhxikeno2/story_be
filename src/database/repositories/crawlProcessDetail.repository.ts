import { Injectable } from '@nestjs/common';
import { CrawlProcessDetailEntity, CrawlProcessDetailStatus } from 'database/entities';
import { DataSource } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class CrawlProcessDetailRepository extends BaseRepository<CrawlProcessDetailEntity> {
  constructor(dataSource: DataSource) {
    super(CrawlProcessDetailEntity, dataSource);
  }

  public async saveCrawlProcessDetail(crawlProcessId: number, page: number, detailUrls: string[]): Promise<void> {
    const details = detailUrls.map((url) => ({
      crawlProcessId,
      page,
      url,
      status: CrawlProcessDetailStatus.CREATED,
    }));

    await this.bulkSave(details);
  }
}
