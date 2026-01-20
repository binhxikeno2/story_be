import { Injectable } from '@nestjs/common';
import { CrawlProcessStatus } from 'database/entities/crawlProcess.entity';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessDetailRepository } from 'database/repositories/crawlProcessDetail.repository';
import { logger } from 'shared/logger/app.logger';

import { getPageCrawl, TARGET_PAGE_CRAWL_URL } from '../shared/constants/app.constant';
import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { parseDetailUrlsFromHtml, parsePaginationFromHtml } from '../shared/utils/parser-html.util';
import { parseLastUpdated } from '../shared/utils/parser-post.utils';
import { CONCURRENCY_CRAWL_PAGE } from './crawl-process.constant';
import { StatsCrawl } from './crawl-process.type';

@Injectable()
export class CrawlProcessService {
  constructor(
    private readonly crawlProcessRepository: CrawlProcessRepository,
    private readonly crawlProcessDetailRepository: CrawlProcessDetailRepository,
    private readonly thirdPartyApiService: ThirdPartyApiService,
  ) {}

  async onCrawlProcess(): Promise<void> {
    if (await this.crawlProcessRepository.isRunning()) {
      logger.info('Crawl process is already running, skipping');

      return;
    }

    const crawlProcess = await this.crawlProcessRepository.createCrawlProcess();

    try {
      const statsCurrent = await this.getStatsCrawl();
      const { pageFrom, pageTo, lastedAt, hasNewPage } = await this.calculateStatsCrawl({ ...statsCurrent });

      if (!hasNewPage) {
        logger.info('No new page found, skipping');

        return;
      }

      await this.crawlProcessRepository.updateAndGetCrawlProcess(crawlProcess.id, {
        range: { pageFrom, pageTo },
        lastedAt,
        status: CrawlProcessStatus.RUNNING,
      });

      const pages = Array.from({ length: pageTo - pageFrom + 1 }, (_, i) => pageFrom + i);
      const batchCount = Math.ceil(pages.length / CONCURRENCY_CRAWL_PAGE);
      const batches = Array.from({ length: batchCount }, (_, i) =>
        pages.slice(i * CONCURRENCY_CRAWL_PAGE, (i + 1) * CONCURRENCY_CRAWL_PAGE),
      );

      for (const batch of batches) {
        await Promise.all(batch.map((page) => this.onCrawlPage(crawlProcess.id, page)));
      }

      await this.crawlProcessRepository.setDone(crawlProcess.id);
    } catch (error) {
      await this.crawlProcessRepository.setError(crawlProcess.id, error.message);
      logger.error(error);
      throw error;
    }
  }

  private async calculateStatsCrawl(statsCurrent: StatsCrawl): Promise<StatsCrawl & { hasNewPage?: boolean }> {
    const crawlProcessLatest = await this.crawlProcessRepository.findCrawlProcessLatest();

    if (!crawlProcessLatest) {
      return statsCurrent;
    }

    const { range, lastedAt: lastedAtLatest } = crawlProcessLatest;
    const pageFromLatest = range?.pageFrom;
    const pageToLatest = range?.pageTo;

    const isSamePageFrom = pageFromLatest === statsCurrent.pageFrom;
    const isSamePageTo = pageToLatest === statsCurrent.pageTo;
    const isSameLastedAt = lastedAtLatest && statsCurrent.lastedAt.getTime() === lastedAtLatest.getTime();
    const isSame = isSamePageFrom && isSamePageTo && isSameLastedAt;

    if (isSame) {
      return {
        ...statsCurrent,
        hasNewPage: false,
      };
    }

    const pageTo = statsCurrent.pageTo - (pageToLatest || 0);

    return {
      pageFrom: 1,
      pageTo: pageTo + 1, // +1 because we need to crawl the next page
      lastedAt: statsCurrent.lastedAt,
      hasNewPage: true,
    };
  }

  private async getStatsCrawl(): Promise<StatsCrawl> {
    const response = await this.thirdPartyApiService.fetchHtml(TARGET_PAGE_CRAWL_URL);
    const { html } = response;
    const paginated = parsePaginationFromHtml(html);
    const lastedAt = parseLastUpdated(html);

    if (!paginated || !lastedAt) {
      throw new Error('Not found stats crawl');
    }

    return {
      pageFrom: paginated.pageFrom,
      pageTo: paginated.pageTo,
      lastedAt,
    };
  }

  private async onCrawlPage(crawlProcessId: number, page: number): Promise<void> {
    const url = getPageCrawl(page);
    const { html } = await this.thirdPartyApiService.fetchHtml(url);

    if (!html) {
      return;
    }

    const detailUrls = parseDetailUrlsFromHtml(html);

    if (detailUrls.length === 0) {
      return;
    }

    await this.crawlProcessDetailRepository.saveCrawlProcessDetail(crawlProcessId, page, detailUrls);

    logger.info(`Crawl page ${page} with ${detailUrls.length} detail urls success`);
  }
}
