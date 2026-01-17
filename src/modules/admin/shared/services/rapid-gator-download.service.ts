import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { plainToInstanceOptions } from 'shared/constants/transform.constant';
import { logger } from 'shared/logger/app.logger';

import {
  RAPIDGATOR_DOWNLOAD_PATH,
  RAPIDGATOR_GET_SESSION_URL,
  RAPIDGATOR_GET_URL_DOWNLOAD,
} from '../constants/rapid-gator-download.constant';
import { RapidGatorDownloadResponseDto } from '../dto/rapid-gator-download.response';
import { RapidGatorSessionResponseDto } from '../dto/rapid-gator-session.response';

@Injectable()
export class RapidGatorDownloadService {
  private sessionId: string | null = null;
  private readonly apiConfig: { userName: string; password: string };
  private readonly s3Client: S3Client;
  private readonly s3Bucket: string;
  private readonly s3Endpoint: string;
  private readonly s3Region: string;

  constructor(private readonly configService: ConfigService) {
    const userName = this.configService.get<string>('RAPIDGATOR_USERNAME');
    const password = this.configService.get<string>('RAPIDGATOR_PASSWORD');

    if (!userName) {
      throw new Error('RAPIDGATOR_USERNAME is not configured in environment variables');
    }

    if (!password) {
      throw new Error('RAPIDGATOR_PASSWORD is not configured in environment variables');
    }

    this.apiConfig = { userName, password };

    const accessKey = this.configService.get<string>('HETZNER_S3_ACCESS_KEY');
    const secretKey = this.configService.get<string>('HETZNER_S3_SECRET_KEY');
    this.s3Endpoint = this.configService.get<string>('HETZNER_S3_ENDPOINT') || '';
    this.s3Bucket = this.configService.get<string>('HETZNER_S3_BUCKET') || '';
    this.s3Region = this.configService.get<string>('HETZNER_S3_REGION') || 'fsn1';

    if (accessKey && secretKey && this.s3Endpoint && this.s3Bucket) {
      this.s3Client = new S3Client({
        endpoint: `https://${this.s3Endpoint}`,
        region: this.s3Region,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: false,
      });
    }
  }

  async downloadDocument(url: string): Promise<string> {
    let sessionId = await this.ensureSessionId();
    let data = await this.fetchDownloadUrl(url, sessionId);

    if (data.responseStatus === 403) {
      this.sessionId = null;
      sessionId = await this.ensureSessionId();
      data = await this.fetchDownloadUrl(url, sessionId);

      if (data.responseStatus === 403) {
        throw new Error('Failed to download document: Session expired or unauthorized (403)');
      }
    }

    const downloadUrl = data?.response?.url;

    if (!downloadUrl) {
      throw new Error('Download URL not found');
    }

    const filePath = await this.downloadFile(downloadUrl);

    return filePath;
  }

  private async fetchDownloadUrl(url: string, sessionId: string): Promise<RapidGatorDownloadResponseDto> {
    const params = new URLSearchParams({
      sid: sessionId,
      url: url,
    });

    const response = await fetch(`${RAPIDGATOR_GET_URL_DOWNLOAD}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = (await response.json()) as RapidGatorDownloadResponseDto;

    return data;
  }

  private async ensureSessionId(): Promise<string> {
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

  async downloadFile(url: string): Promise<string> {
    logger.info(`[RapidGatorDownloadService] Starting download from ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorMessage = `Failed to download file: ${response.status} ${response.statusText}`;
      logger.error(`[RapidGatorDownloadService] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const extension = this.extractExtensionFromResponse(response);
    const randomKey = this.generateRandomKey();
    const objectKey = `${randomKey}${extension}`;

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (this.s3Client) {
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: objectKey,
          Body: uint8Array,
          ContentType: contentType,
          ACL: 'public-read',
        }),
      );

      const s3Url = `https://${this.s3Bucket}.${this.s3Endpoint}/${objectKey}`;
      logger.info(`[RapidGatorDownloadService] Successfully uploaded file to ${s3Url}`);

      return s3Url;
    }

    const downloadDir = path.join(process.cwd(), RAPIDGATOR_DOWNLOAD_PATH);

    try {
      await fs.access(downloadDir);
    } catch {
      await fs.mkdir(downloadDir, { recursive: true });
    }

    const filePath = path.join(downloadDir, objectKey);
    await fs.writeFile(filePath, uint8Array);

    logger.info(`[RapidGatorDownloadService] Successfully downloaded file to ${filePath}`);

    return filePath;
  }

  private extractExtensionFromResponse(response: Response): string {
    const contentDisposition = response.headers.get('content-disposition');

    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        let fileName = fileNameMatch[1].replace(/['"]/g, '');
        fileName = decodeURIComponent(fileName);

        if (fileName) {
          const ext = path.extname(fileName);
          if (ext && (ext === '.rar' || ext === '.zip' || ext === '.7z' || ext === '.tar' || ext === '.gz')) {
            return ext;
          }
        }
      }
    }

    const urlPath = new URL(response.url).pathname;
    const ext = path.extname(urlPath);

    if (ext && (ext === '.rar' || ext === '.zip' || ext === '.7z' || ext === '.tar' || ext === '.gz')) {
      return ext;
    }

    return '.zip';
  }

  private generateRandomKey(): string {
    const randomId1 = Math.random().toString(36).substring(2, 15);
    const randomId2 = Math.random().toString(36).substring(2, 15);

    return `${randomId1}${randomId2}`;
  }
}
