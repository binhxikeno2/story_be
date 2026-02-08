import { Injectable } from '@nestjs/common';
import {
  CrawlProcessDetailEntity,
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

  public async findPageCrawlError(crawlProcess: CrawlProcessEntity): Promise<number[]> {
    if (!crawlProcess.range) {
      return [];
    }

    const { pageFrom, pageTo } = crawlProcess.range;
    const detailRepository = this.dataSource.getRepository(CrawlProcessDetailEntity);

    // Fetch only distinct pages that have been crawled - much smaller dataset
    const crawledPages = await detailRepository
      .createQueryBuilder('detail')
      .select('DISTINCT detail.page', 'page')
      .where('detail.crawlProcessId = :crawlProcessId', { crawlProcessId: crawlProcess.id })
      .getRawMany();

    // Create Set for O(1) lookup performance
    const crawledPageSet = new Set(crawledPages.map((item) => item.page));

    // Loop through range and find missing pages - no large array creation
    const errorPages: number[] = [];
    for (let page = pageFrom; page <= pageTo; page++) {
      if (!crawledPageSet.has(page)) {
        errorPages.push(page);
      }
    }

    return errorPages;
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

  public async setStatusCrawlProcess(id: number, status: CrawlProcessStatus): Promise<void> {
    await this.getRepository().update(id, { status });
  }

  public async updateStats(id: number): Promise<void> {
    const stats = await this.calculateStats(id);

    await this.getRepository().update(id, {
      stats,
    });
  }

  public async setDone(id: number): Promise<void> {
    const stats = await this.calculateStats(id);

    await this.getRepository().update(id, {
      status: CrawlProcessStatus.DONE,
      stats,
    });
  }

  public async calculateStats(crawlProcessId: number): Promise<CrawlProcessStats> {
    const detailRepository = this.dataSource.getRepository(CrawlProcessDetailEntity);

    const [crawledPageResult, crawlProcess] = await Promise.all([
      detailRepository
        .createQueryBuilder('detail')
        .select('COUNT(DISTINCT detail.page)', 'count')
        .where('detail.crawlProcessId = :crawlProcessId', { crawlProcessId })
        .getRawOne(),
      this.getRepository().findOne({ where: { id: crawlProcessId } }),
    ]);

    const range = crawlProcess?.range;
    const totalPage = range ? range.pageTo : 0;
    const crawledPageCount = parseInt(crawledPageResult?.count || '0', 10);

    return {
      totalPage,
      crawled: crawledPageCount,
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
