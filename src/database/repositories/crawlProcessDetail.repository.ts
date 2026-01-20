import { Injectable } from '@nestjs/common';
import {
  CrawlProcessDetailEntity,
  CrawlProcessDetailPostLinkEntity,
  CrawlProcessDetailStatus,
} from 'database/entities';
import { DataSource, In } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class CrawlProcessDetailRepository extends BaseRepository<CrawlProcessDetailEntity> {
  constructor(dataSource: DataSource) {
    super(CrawlProcessDetailEntity, dataSource);
  }

  public async saveCrawlProcessDetail(
    crawlProcessId: number,
    page: number,
    detailUrls: Array<{ url: string; title: string }>,
  ): Promise<void> {
    if (detailUrls.length === 0) {
      return;
    }

    const urls = detailUrls.map((item) => item.url);
    const existingDetails = await this.findBy({
      url: In(urls),
    });

    const existingUrls = new Set(existingDetails.map((detail) => detail.url));
    const newDetailUrls = detailUrls.filter((item) => !existingUrls.has(item.url));

    if (newDetailUrls.length === 0) {
      return;
    }

    const details = newDetailUrls.map((item) => ({
      crawlProcessId,
      page,
      status: CrawlProcessDetailStatus.CREATED,
      url: item.url,
      title: item.title,
    }));

    await this.bulkSave(details);
  }

  public async getCrawlProcessDetailWithStatus(
    status: CrawlProcessDetailStatus[],
  ): Promise<Array<CrawlProcessDetailEntity>> {
    return this.createQueryBuilder('crawl_process_detail')
      .select('crawl_process_detail.id', 'id')
      .addSelect('crawl_process_detail.status', 'status')
      .addSelect('crawl_process_detail.url', 'url')
      .addSelect('crawl_process_detail.title', 'title')
      .where('crawl_process_detail.status IN (:...status)', { status })
      .orderBy('crawl_process_detail.status', 'ASC')
      .addOrderBy('crawl_process_detail.id', 'ASC')
      .getRawMany();
  }

  public async setError(id: number, error: string): Promise<void> {
    await this.getRepository().update(id, { status: CrawlProcessDetailStatus.FAILED, error });
  }

  public async setDone(id: number): Promise<void> {
    await this.getRepository().update(id, { status: CrawlProcessDetailStatus.DONE });
  }

  public async linkCrawlProcessDetailToPost(crawlProcessDetailId: number, postId: number): Promise<void> {
    const linkRepository = this.dataSource.getRepository(CrawlProcessDetailPostLinkEntity);

    const existingLink = await linkRepository.findOne({
      where: [{ crawlProcessDetailId }, { postId }],
    });

    if (existingLink) {
      return;
    }

    await linkRepository.save({
      crawlProcessDetailId,
      postId,
    });
  }
}
