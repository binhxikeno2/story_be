import { Injectable } from '@nestjs/common';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessDetailRepository } from 'database/repositories/crawlProcessDetail.repository';
import { logger } from 'shared/logger/app.logger';

import { getPageCrawl } from '../shared/constants/app.constant';
import { ThirdPartyApiService } from '../shared/services/third-party-api.service';
import { parseDetailUrlsFromHtml, parsePaginationFromHtml } from '../shared/utils/parser-html.util';
import { CONCURRENCY, PAGE_TO_DEFAULT } from './crawl-process.constant';

@Injectable()
export class CrawlProcessService {
  constructor(
    private readonly crawlProcessRepository: CrawlProcessRepository,
    private readonly crawlProcessDetailRepository: CrawlProcessDetailRepository,
    private readonly thirdPartyApiService: ThirdPartyApiService,
  ) {}
  async onCrawlProcess(): Promise<void> {
    try {
      const crawlProcess = await this.crawlProcessRepository.createCrawlProcess();
      const crawlProcessId = crawlProcess.id;
      let currentPage = 1;
      let pageTo = PAGE_TO_DEFAULT;
      const batch: Promise<{ pageTo?: number } | undefined>[] = [];

      while (currentPage <= pageTo) {
        batch.push(this.crawlPage(crawlProcessId, currentPage));

        if (batch.length === CONCURRENCY || currentPage === pageTo) {
          const results = await Promise.all(batch);
          const pageToValues = results
            .map((result) => result?.pageTo)
            .filter((value): value is number => Boolean(value));

          if (pageToValues.length > 0) {
            pageTo = Math.max(...pageToValues);
          }

          batch.length = 0;
        }

        currentPage++;
      }
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  private async crawlPage(crawlProcessId: number, page: number) {
    const url = getPageCrawl(page);
    const { html } = await this.thirdPartyApiService.fetchHtml(url);

    if (!html) {
      return;
    }

    const paginated = parsePaginationFromHtml(html);
    const detailUrls = parseDetailUrlsFromHtml(html);

    if (!paginated || detailUrls.length === 0) {
      return;
    }

    await this.crawlProcessDetailRepository.saveCrawlProcessDetail(crawlProcessId, page, detailUrls);

    return {
      pageTo: paginated.pageTo,
    };
  }
}
