import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { plainToInstance } from 'class-transformer';
import { plainToInstanceOptions } from 'shared/constants/transform.constant';
import { logger } from 'shared/logger/app.logger';

import {
  RAPIDGATOR_CHUNK_CONCURRENCY,
  RAPIDGATOR_CHUNK_DOWNLOAD_RETRIES,
  RAPIDGATOR_CHUNK_DOWNLOAD_TIMEOUT_MS,
  RAPIDGATOR_CHUNK_SIZE_BYTES,
  RAPIDGATOR_GET_SESSION_URL,
  RAPIDGATOR_GET_URL_DOWNLOAD,
} from '../constants/rapid-gator-download.constant';
import { RapidGatorDownloadResponseDto } from '../dto/rapid-gator-download.response';
import { RapidGatorSessionResponseDto } from '../dto/rapid-gator-session.response';
import { RapidGatorApiError } from '../errors/rapid-gator-api.error';
import { HetznerS3Service, MultipartCompletedPart } from './hetzner-s3.service';

export type RapidGatorPeekOk = {
  ok: true;
  downloadUrl: string;
  contentLength: number;
  contentType: string;
  extension: string;
};

export type RapidGatorPeekFail = {
  ok: false;
  statusCode: number;
};

export type RapidGatorPeekResult = RapidGatorPeekOk | RapidGatorPeekFail;

export type ChunkDownloadMeta = {
  contentLength: number;
  contentType: string;
};

@Injectable()
export class RapidGatorDownloadService {
  private sessionId: string | null = null;
  private readonly apiConfig: { userName: string; password: string };

  constructor(private readonly configService: ConfigService, private readonly hetznerS3Service: HetznerS3Service) {
    const userName = this.configService.get<string>('RAPIDGATOR_USERNAME') || '';
    const password = this.configService.get<string>('RAPIDGATOR_PASSWORD') || '';

    this.apiConfig = { userName, password };
  }

  /**
   * Resolve RapidGator page URL to a direct download URL and validate remote supports ranged GET (HEAD).
   * Use this before chunkDownloadAndUpload to handle 401/404 and to obtain extension for the S3 key.
   */
  public async peekRapidGatorTransfer(rapidGatorPageUrl: string): Promise<RapidGatorPeekResult> {
    try {
      const data = await this.fetchURLFromRapid(rapidGatorPageUrl);

      if ([401, 404].includes(data.responseStatus as number)) {
        return { ok: false, statusCode: data.responseStatus as number };
      }

      const downloadUrl = data?.response?.url;
      if (!downloadUrl) {
        throw new Error('Download URL not found');
      }

      const headMeta = await this.headRemoteFile(downloadUrl);

      return {
        ok: true,
        downloadUrl,
        contentLength: headMeta.contentLength,
        contentType: headMeta.contentType,
        extension: headMeta.extension,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('403') || msg.includes('Unauthorized')) {
        return { ok: false, statusCode: 403 };
      }

      throw e;
    }
  }

  /**
   * Full pipeline: resolve RapidGator URL → HEAD → multipart upload to S3 (no full-file buffer).
   */
  public async transferRapidToS3(rapidGatorPageUrl: string, key: string): Promise<void> {
    const peek = await this.peekRapidGatorTransfer(rapidGatorPageUrl);
    if (!peek.ok) {
      throw new RapidGatorApiError(peek.statusCode);
    }

    await this.chunkDownloadAndUpload(peek.downloadUrl, key, {
      contentLength: peek.contentLength,
      contentType: peek.contentType,
    });
  }

  public async chunkDownloadAndUpload(downloadUrl: string, key: string, meta: ChunkDownloadMeta): Promise<void> {
    const { contentLength, contentType } = meta;
    const chunkSize = RAPIDGATOR_CHUNK_SIZE_BYTES;
    const partCount = Math.ceil(contentLength / chunkSize);

    if (partCount === 0) {
      throw new Error('Empty file (content-length is zero)');
    }

    const { uploadId } = await this.hetznerS3Service.createMultipartUpload({
      key,
      contentType,
      acl: 'public-read',
    });

    const completedParts: (MultipartCompletedPart | undefined)[] = new Array(partCount);
    let nextIndex = 0;
    let lastLoggedPercent = -1;

    const runWorker = async () => {
      while (true) {
        const partIndex = nextIndex++;
        if (partIndex >= partCount) {
          return;
        }

        const start = partIndex * chunkSize;
        const end = Math.min(start + chunkSize, contentLength) - 1;
        const expectedBytes = end - start + 1;

        const buffer = await this.downloadChunkWithRetry(downloadUrl, start, end, contentLength, partCount);

        if (buffer.byteLength !== expectedBytes) {
          throw new Error(
            `Chunk size mismatch for part ${partIndex + 1}: expected ${expectedBytes}, got ${buffer.byteLength}`,
          );
        }

        const body = new Uint8Array(buffer);
        const { etag } = await this.hetznerS3Service.uploadPart({
          key,
          uploadId,
          partNumber: partIndex + 1,
          body,
        });

        completedParts[partIndex] = { ETag: etag, PartNumber: partIndex + 1 };

        const doneParts = completedParts.filter(Boolean).length;
        const pct = Math.floor((doneParts / partCount) * 100);
        if (pct >= lastLoggedPercent + 5 || doneParts === partCount) {
          lastLoggedPercent = pct;
          logger.info(
            `[RapidGatorDownloadService] Multipart progress key=${key} ${doneParts}/${partCount} parts (~${pct}%)`,
          );
        }
      }
    };

    try {
      const workers = Math.min(RAPIDGATOR_CHUNK_CONCURRENCY, partCount);
      await Promise.all(Array.from({ length: workers }, () => runWorker()));
      const finalized = completedParts.map((p, i) => {
        if (!p) {
          throw new Error(`Internal error: missing multipart part ${i + 1}`);
        }

        return p;
      });
      await this.hetznerS3Service.completeMultipartUpload({ key, uploadId, parts: finalized });
    } catch (e) {
      await this.hetznerS3Service.abortMultipartUpload({ key, uploadId });
      throw e;
    }
  }

  public async downloadChunkWithRetry(
    url: string,
    start: number,
    end: number,
    totalSize: number,
    totalParts: number,
  ): Promise<ArrayBuffer> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= RAPIDGATOR_CHUNK_DOWNLOAD_RETRIES; attempt++) {
      try {
        return await this.downloadChunk(url, start, end, totalSize, totalParts);
      } catch (e) {
        lastError = e;
        logger.warn(
          `[RapidGatorDownloadService] downloadChunk bytes=${start}-${end} attempt ${attempt}/${RAPIDGATOR_CHUNK_DOWNLOAD_RETRIES} failed: ${e}`,
        );
        if (attempt < RAPIDGATOR_CHUNK_DOWNLOAD_RETRIES) {
          await this.delay(500 * attempt);
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`downloadChunk failed after ${RAPIDGATOR_CHUNK_DOWNLOAD_RETRIES} attempts`);
  }

  public async downloadChunk(
    url: string,
    start: number,
    end: number,
    totalSize: number,
    totalParts: number,
  ): Promise<ArrayBuffer> {
    const expectedLength = end - start + 1;

    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      headers: {
        Range: `bytes=${start}-${end}`,
      },
      timeout: RAPIDGATOR_CHUNK_DOWNLOAD_TIMEOUT_MS,
      maxBodyLength: expectedLength + 1024,
      maxContentLength: expectedLength + 1024,
      validateStatus: () => true,
    });

    this.assertRangedResponseOk(response, start, end, totalSize, totalParts, expectedLength);

    return response.data;
  }

  async fetchURLFromRapid(url: string) {
    let sessionId = await this.authenticationSession();
    let data = await this.fetchDownloadUrl(url, sessionId);

    if ([403, 401].includes(data.responseStatus || 0)) {
      this.sessionId = null;
      sessionId = await this.authenticationSession();
      data = await this.fetchDownloadUrl(url, sessionId);

      if (data.responseStatus === 403) {
        throw new Error('Failed to download document: Session expired or unauthorized (403)');
      }
    }

    return data;
  }

  private async headRemoteFile(url: string): Promise<{
    contentLength: number;
    contentType: string;
    extension: string;
  }> {
    const response = await axios.head(url, {
      maxRedirects: 5,
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      throw new Error(`HEAD failed: HTTP ${response.status}`);
    }

    const acceptRanges = String(response.headers['accept-ranges'] || '').toLowerCase();
    if (!acceptRanges.includes('bytes')) {
      throw new Error('Remote server does not support ranged downloads (missing Accept-Ranges: bytes)');
    }

    const cl = response.headers['content-length'];
    const contentLength = cl ? parseInt(String(cl), 10) : NaN;
    if (!Number.isFinite(contentLength) || contentLength <= 0) {
      throw new Error('HEAD response missing valid Content-Length');
    }

    const contentType = String(response.headers['content-type'] || 'application/octet-stream');
    const extension = this.detectFileExtensionFromAxios(response, url, contentType);

    return { contentLength, contentType, extension };
  }

  private assertRangedResponseOk(
    response: AxiosResponse<ArrayBuffer>,
    start: number,
    end: number,
    totalSize: number,
    totalParts: number,
    expectedLength: number,
  ): void {
    const buf = response.data;
    const status = response.status;
    const singlePart = totalParts === 1;

    if (status === 206) {
      if (buf.byteLength !== expectedLength) {
        throw new Error(`Invalid partial content length: expected ${expectedLength}, got ${buf.byteLength}`);
      }

      return;
    }

    if (status === 200 && singlePart && buf.byteLength === totalSize && buf.byteLength === expectedLength) {
      return;
    }

    if (status === 200 && !singlePart) {
      throw new Error('Server returned 200 for a ranged request on a multi-part file (would buffer entire object)');
    }

    throw new Error(`Unexpected HTTP status ${status} for Range bytes=${start}-${end}`);
  }

  private async fetchDownloadUrl(url: string, sessionId: string): Promise<RapidGatorDownloadResponseDto> {
    try {
      const response = await axios.get(RAPIDGATOR_GET_URL_DOWNLOAD, {
        params: {
          sid: sessionId,
          url: url,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return plainToInstance(RapidGatorDownloadResponseDto, response.data);
    } catch (error: any) {
      return {
        responseStatus: error.response?.status,
      };
    }
  }

  private async authenticationSession(): Promise<string> {
    if (!this.sessionId) {
      this.sessionId = await this.getSessionDownload();
    }

    return this.sessionId;
  }

  private async getSessionDownload(): Promise<string> {
    const params = new URLSearchParams({
      username: this.apiConfig.userName,
      password: this.apiConfig.password,
    });

    const response = await fetch(`${RAPIDGATOR_GET_SESSION_URL}?${params.toString()}`, {
      method: 'GET',
    });

    const jsonData = await response.json();
    const data = plainToInstance(RapidGatorSessionResponseDto, jsonData, plainToInstanceOptions);

    return data?.response?.sessionId || '';
  }

  private detectFileExtensionFromAxios(response: AxiosResponse, url: string, contentType: string): string {
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const fileNameMatch = String(contentDisposition).match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        let fileName = fileNameMatch[1].replace(/['"]/g, '');
        fileName = decodeURIComponent(fileName);
        if (fileName) {
          const ext = this.extractExtensionFromFileName(fileName);
          if (ext) {
            return ext;
          }
        }
      }
    }

    try {
      const urlPath = new URL(url).pathname;
      const ext = this.extractExtensionFromFileName(urlPath);
      if (ext) {
        return ext;
      }
    } catch {}

    const contentTypeMap: Record<string, string> = {
      'application/x-rar-compressed': '.rar',
      'application/vnd.rar': '.rar',
      'application/zip': '.zip',
      'application/x-7z-compressed': '.7z',
      'application/x-tar': '.tar',
      'application/gzip': '.gz',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };

    return contentTypeMap[contentType] || '';
  }

  private extractExtensionFromFileName(fileName: string): string {
    const ext = fileName.substring(fileName.lastIndexOf('.'));
    const validExtensions = ['.rar', '.zip', '.7z', '.tar', '.gz', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (validExtensions.includes(ext.toLowerCase())) {
      return ext.toLowerCase();
    }

    return '';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
