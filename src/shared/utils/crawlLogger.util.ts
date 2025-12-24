import { logger } from 'shared/logger/app.logger';

/**
 * Utility for consistent crawl logging
 * Provides structured logging with consistent format for easier maintenance
 */
export class CrawlLogger {
    private static readonly PREFIX = {
        PAGE: '[PageCrawler]',
        DETAIL: '[DetailCrawler]',
        WORKER: '[Worker]',
    };

    // Page Crawler Logs
    static pageAllCompleted(processId: number): void {
        logger.info(`${this.PREFIX.PAGE} ✅ All pages completed for process: ${processId}`);
    }

    static pageStart(pageNo: number, processId: number, url: string): void {
        logger.info(`${this.PREFIX.PAGE} 📄 Crawling page ${pageNo} of process ${processId}`);
        logger.info(`${this.PREFIX.PAGE} 🔗 URL: ${url}`);
    }

    static pageRetry(attempt: number, maxRetries: number, delayMs: number): void {
        logger.info(`${this.PREFIX.PAGE} 🔄 Retry attempt ${attempt}/${maxRetries}, waiting ${delayMs}ms...`);
    }

    static pageFetchSuccess(htmlLength: number): void {
        logger.info(`${this.PREFIX.PAGE} ✅ Fetched HTML successfully, length: ${htmlLength} characters`);
    }

    static pageFetchInvalid(contentEncoding: string | null, preview: string): void {
        logger.warn(`${this.PREFIX.PAGE} ⚠️  Response may not be valid HTML, encoding: ${contentEncoding || 'none'}`);
        logger.warn(`${this.PREFIX.PAGE} 📋 Preview: ${preview}`);
    }

    static page403Retry(attempt: number): void {
        logger.warn(`${this.PREFIX.PAGE} ⚠️  403 error on attempt ${attempt}, retrying...`);
    }

    static page403Failed(pageId: number, maxRetries: number): void {
        logger.error(`${this.PREFIX.PAGE} ❌ Cloudflare protection detected after ${maxRetries} attempts, skipping page ${pageId}`);
    }

    static page403Skipped(pageId: number): void {
        logger.error(`${this.PREFIX.PAGE} ❌ Cloudflare protection detected, skipping page ${pageId}`);
    }

    static pageError(pageId: number, error: string): void {
        logger.error(`${this.PREFIX.PAGE} ❌ Error crawling page ${pageId}: ${error}`);
    }

    static pageSkipped(pageId: number): void {
        logger.warn(`${this.PREFIX.PAGE} ⏭️  Skipping page ${pageId} due to Cloudflare protection, continuing...`);
    }

    static pageAttemptFailed(attempt: number): void {
        logger.warn(`${this.PREFIX.PAGE} ⚠️  Attempt ${attempt} failed, retrying...`);
    }

    static pageParseSuccess(urlCount: number, sampleUrls: string[]): void {
        logger.info(`${this.PREFIX.PAGE} 📊 Parsed ${urlCount} detail URLs`);
        if (sampleUrls.length > 0) {
            logger.info(`${this.PREFIX.PAGE} 🔗 Sample URLs: ${sampleUrls.slice(0, 5).join(', ')}`);
        }
    }

    static pageItemsCreated(count: number): void {
        logger.info(`${this.PREFIX.PAGE} ✅ Created ${count} crawl items`);
    }

    static pageCompleted(pageNo: number, itemsCount: number): void {
        logger.info(`${this.PREFIX.PAGE} ✅ Completed page ${pageNo}, found ${itemsCount} items`);
    }

    // Detail Crawler Logs
    static detailNoItems(processId: number): void {
        logger.info(`${this.PREFIX.DETAIL} ✅ No items to crawl for process: ${processId}`);
    }

    static detailStart(url: string): void {
        logger.info(`${this.PREFIX.DETAIL} 📄 Crawling detail: ${url}`);
    }

    static detailFetchSuccess(htmlLength: number): void {
        logger.info(`${this.PREFIX.DETAIL} ✅ Fetched HTML successfully, length: ${htmlLength} characters`);
    }

    static detailCompleted(url: string): void {
        logger.info(`${this.PREFIX.DETAIL} ✅ Crawled detail: ${url}`);
    }

    static detailError(itemId: number, error: string): void {
        logger.error(`${this.PREFIX.DETAIL} ❌ Error crawling item ${itemId}: ${error}`);
    }

    // Worker Logs
    static workerStart(): void {
        logger.info(`${this.PREFIX.WORKER} 🚀 Starting worker loop...`);
    }

    static workerProcessRunning(processId: number): void {
        logger.info(`${this.PREFIX.WORKER} ⏸️  Process ${processId} is already running, skipping`);
    }

    static workerError(message: string, error?: unknown): void {
        logger.error(`${this.PREFIX.WORKER} ❌ ${message}`, error);
    }
}

