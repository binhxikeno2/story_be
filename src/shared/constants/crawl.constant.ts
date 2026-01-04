export enum CrawlStatus {
    // Process status
    CREATED = 'created',
    RUNNING_PAGE = 'running_page',
    RUNNING_DETAIL = 'running_detail',
    FINALIZING = 'finalizing',
    CRAWLED = 'crawled',
    ERROR = 'error',
    PAUSED = 'paused',
    CANCELLED = 'cancelled',
    // Page/Item status
    PENDING = 'pending',
    RUNNING = 'running',
    DONE = 'done',
    FAILED = 'failed',
    DUPLICATE = 'duplicate',
    NOT_NEW_PAGE = 'not_new_page',
}

