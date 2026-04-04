export const RAPIDGATOR_GET_URL_DOWNLOAD = 'https://rapidgator.net/api/file/download';
export const RAPIDGATOR_GET_SESSION_URL = 'https://rapidgator.net/api/user/login';
export const RAPIDGATOR_DOWNLOAD_PATH = 'downloads';

/** S3 multipart minimum part size (except last part) is 5 MiB; keep chunks in 5–20 MiB range. */
export const RAPIDGATOR_CHUNK_SIZE_BYTES = 8 * 1024 * 1024;

export const RAPIDGATOR_CHUNK_DOWNLOAD_RETRIES = 3;

export const RAPIDGATOR_CHUNK_CONCURRENCY = 4;

/** Per-chunk HTTP timeout (large files use many short requests instead of one long connection). */
export const RAPIDGATOR_CHUNK_DOWNLOAD_TIMEOUT_MS = 180_000;
