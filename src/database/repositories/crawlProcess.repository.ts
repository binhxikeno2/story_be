import { Injectable } from '@nestjs/common';
import {
  CrawlProcessDetailEntity,
  CrawlProcessDetailStatus,
  CrawlProcessEntity,
  CrawlProcessRange,
  CrawlProcessStats,
  CrawlProcessStatus,
} from 'database/entities';
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

  public async setError(id: number, error: string): Promise<void> {
    const stats = await this.calculateStats(id);
    await this.getRepository().update(id, { status: CrawlProcessStatus.FAILED, error, stats });
  }

  public async updateAndGetCrawlProcess(id: number, data: Partial<CrawlProcessEntity>): Promise<CrawlProcessEntity> {
    return this.getRepository().save({ id, ...data });
  }

  public async setDone(id: number): Promise<void> {
    const stats = await this.calculateStats(id);

    await this.getRepository().update(id, {
      status: CrawlProcessStatus.DONE,
      stats,
    });
  }

  private async calculateStats(crawlProcessId: number): Promise<CrawlProcessStats> {
    const detailRepository = this.dataSource.getRepository(CrawlProcessDetailEntity);

    const [totalPage, crawled] = await Promise.all([
      detailRepository.count({ where: { crawlProcessId } }),
      detailRepository.count({ where: { crawlProcessId, status: CrawlProcessDetailStatus.DONE } }),
    ]);

    return {
      totalPage,
      crawled,
    };
  }

  public async isRunning(): Promise<boolean> {
    return this.getRepository().exist({ where: { status: CrawlProcessStatus.RUNNING } });
  }

  public async findCrawlProcessLatest(): Promise<CrawlProcessEntity | null> {
    //status done and lastedAt latest
    return this.getRepository().findOne({
      where: { status: CrawlProcessStatus.DONE },
      order: { lastedAt: 'DESC', createdAt: 'DESC' },
    });
  }
}
