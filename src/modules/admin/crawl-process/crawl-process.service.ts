import { Injectable } from '@nestjs/common';
import { CrawlProcessEntity, CrawlProcessStatus } from 'database/entities/crawlProcess.entity';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessDetailRepository } from 'database/repositories/crawlProcessDetail.repository';
import * as dayjsModule from 'dayjs';

const dayjs = (dayjsModule as { default?: typeof dayjsModule }).default ?? dayjsModule;
import { logger } from 'shared/logger/app.logger';

import { getPageCrawl, TARGET_PAGE_CRAWL_URL } from '../shared/constants/app.constant';
import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { parseDetailUrlsFromHtml, parsePaginationFromHtml } from '../shared/utils/parser-html.util';
import { parseLastUpdated } from '../shared/utils/parser-post.utils';
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
      const { pageFrom, pageTo, lastedAt, pageFound } = statsCurrent;
      const crawlProcessLatest = await this.crawlProcessRepository.findCrawlProcessLatest();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const lastedAtFromCrawlProcessLatest = dayjs(crawlProcessLatest!.lastedAt).subtract(1, 'day');

      logger.info('Start time', lastedAtFromCrawlProcessLatest.format('YYYY-MM-DD HH:mm:ss'));

      await this.crawlProcessRepository.updateAndGetCrawlProcess(crawlProcess.id, {
        range: { pageFrom, pageTo, pageFound },
        lastedAt,
        status: CrawlProcessStatus.RUNNING,
      });

      const pages = Array.from({ length: pageTo - pageFrom + 1 }, (_, i) => pageFrom + i);

      for (const page of pages) {
        const lastedAtOnPage = await this.onCrawlPage(crawlProcess.id, page);

        if (lastedAtOnPage) {
          const lastedAtOnPageFormat = dayjs(lastedAtOnPage);
          logger.info('Lasted at on page', lastedAtOnPageFormat.format('YYYY-MM-DD HH:mm:ss'));

          if (!lastedAtOnPageFormat.isAfter(lastedAtFromCrawlProcessLatest)) {
            await this.crawlProcessRepository.updateAndGetCrawlProcess(crawlProcess.id, {
              range: { pageFrom, pageTo: page, pageFound: pageFound },
              lastedAt: lastedAtOnPage,
            });
            break;
          }
        }
      }

      const stats = await this.crawlProcessRepository.calculateStats(crawlProcess.id);

      if (stats.crawled < stats.totalPage) {
        await this.retryCrawlPageError(crawlProcess, 3);
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
      return { ...statsCurrent, hasNewPage: true };
    }

    const { range, lastedAt: lastedAtLatest } = crawlProcessLatest;
    const pageFromLatest = range?.pageFrom;
    const pageFoundLatest = range?.pageFound;

    const isSamePageFrom = pageFromLatest === statsCurrent.pageFrom;
    const isSamePageTo = pageFoundLatest === statsCurrent.pageTo;
    const isSameLastedAt = lastedAtLatest && statsCurrent.lastedAt.getTime() === lastedAtLatest.getTime();
    const isSame = isSamePageFrom && isSamePageTo && isSameLastedAt;

    if (isSame) {
      return {
        ...statsCurrent,
        hasNewPage: false,
      };
    }

    const pageTo = statsCurrent.pageTo - (pageFoundLatest || 0);

    return {
      pageFrom: 1,
      pageTo: pageTo + 1, // +1 because we need to crawl the next page
      lastedAt: statsCurrent.lastedAt,
      pageFound: statsCurrent.pageTo,
      hasNewPage: true,
    };
  }

  private async getStatsCrawl(): Promise<StatsCrawl> {
    const response = await this.thirdPartyApiService.fetchHtml(TARGET_PAGE_CRAWL_URL);
    const { html, blocked } = response;

    if (blocked) {
      throw new Error('Blocked by Cloudflare');
    }

    const paginated = parsePaginationFromHtml(html);
    const lastedAt = parseLastUpdated(html);

    if (!paginated || !lastedAt) {
      throw new Error('Not found stats crawl');
    }

    return {
      pageFrom: paginated.pageFrom,
      pageTo: paginated.pageTo,
      pageFound: paginated.pageTo,
      lastedAt,
    };
  }

  private async onCrawlPage(crawlProcessId: number, page: number) {
    const url = getPageCrawl(page);
    const { html, blocked } = await this.thirdPartyApiService.fetchHtml(url);

    if (blocked) {
      logger.warn(`Crawl page ${page} blocked by Cloudflare, skipping`);

      return;
    }

    if (!html) {
      return;
    }

    const detailUrls = parseDetailUrlsFromHtml(html);

    if (detailUrls.length === 0) {
      return;
    }

    const lastedAt = parseLastUpdated(html);

    await this.crawlProcessDetailRepository.saveCrawlProcessDetail(crawlProcessId, page, detailUrls);

    logger.info(`Crawl page ${page} with ${detailUrls.length} detail urls success`);

    return lastedAt;
  }

  private async retryCrawlPageError(crawlProcess: CrawlProcessEntity, maxRetries = 3): Promise<void> {
    for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
      const pageCrawlError = await this.crawlProcessRepository.findPageCrawlError(crawlProcess);

      if (pageCrawlError.length === 0) {
        return;
      }

      for (const page of pageCrawlError) {
        await this.onCrawlPage(crawlProcess.id, page);
      }

      // After retry, check if there are still error pages
      if (retryCount < maxRetries) {
        const remainingErrors = await this.crawlProcessRepository.findPageCrawlError(crawlProcess);

        if (remainingErrors.length === 0) {
          return;
        }
      }
    }
  }
}
