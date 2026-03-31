import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { plainToInstanceOptions } from 'shared/constants/transform.constant';
import { Readable } from 'stream';

import { RAPIDGATOR_GET_SESSION_URL, RAPIDGATOR_GET_URL_DOWNLOAD } from '../constants/rapid-gator-download.constant';
import { RapidGatorDownloadResponseDto } from '../dto/rapid-gator-download.response';
import { RapidGatorSessionResponseDto } from '../dto/rapid-gator-session.response';

@Injectable()
export class RapidGatorDownloadService {
  private sessionId: string | null = null;
  private readonly apiConfig: { userName: string; password: string };

  constructor(private readonly configService: ConfigService) {
    const userName = this.configService.get<string>('RAPIDGATOR_USERNAME') || '';
    const password = this.configService.get<string>('RAPIDGATOR_PASSWORD') || '';

    this.apiConfig = { userName, password };
  }

  async fetchURLFromRapid(url: string) {
    let sessionId = await this.authenticationSession();
    let data = await this.fetchDownloadUrl(url, sessionId);

    if (data.responseStatus === 403) {
      this.sessionId = null;
      sessionId = await this.authenticationSession();
      data = await this.fetchDownloadUrl(url, sessionId);

      if (data.responseStatus === 403) {
        throw new Error('Failed to download document: Session expired or unauthorized (403)');
      }
    }

    return data;
  }

  async getDocumentFromRapidGator(url: string): Promise<{
    file?: {
      data: Readable | null;
      contentType: string;
      extension: string;
      contentLength?: number;
    };
    statusCode?: number;
  }> {
    const data = await this.fetchURLFromRapid(url);

    if ([401, 404].includes(data.responseStatus as number)) {
      return { statusCode: data.responseStatus };
    }

    const downloadUrl = data?.response?.url;

    if (!downloadUrl) {
      throw new Error('Download URL not found');
    }

    const result = await this.downloadFile(downloadUrl);

    return { file: result };
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
    } catch (error) {
      return {
        responseStatus: error.response.status,
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

  async downloadFile(url: string): Promise<{
    data: Readable;
    contentType: string;
    extension: string;
    contentLength?: number;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 phút

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Download timeout after 30 minutes for URL: ${url}`);
      }

      throw new Error(`Fetch failed: ${err}`);
    }

    if (!response.ok) {
      throw new Error(`Failed: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength, 10) : 0;

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    const extension = this.detectFileExtension(response, url, contentType);

    if (!response.body) {
      throw new Error('No response body');
    }

    const stream = Readable.fromWeb(response.body as any);

    stream.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Stream error:', err);
    });

    stream.on('close', () => {
      // eslint-disable-next-line no-console
      console.log('Stream closed');
    });

    return {
      data: stream,
      contentType,
      extension,
      contentLength: fileSize || undefined,
    };
  }

  private detectFileExtension(response: Response, url: string, contentType: string): string {
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
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
}
