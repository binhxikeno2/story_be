import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  async getDocumentFromRapidGator(url: string): Promise<{
    data: Uint8Array | Readable | null;
    contentType: string;
    extension: string;
    contentLength?: number;
    notFound?: boolean;
  }> {
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

    if (data.responseStatus === 401) {
      return { data: null, contentType: '', extension: '' };
    }

    if (data.responseStatus === 404) {
      return { data: null, contentType: '', extension: '', notFound: true };
    }

    const downloadUrl = data?.response?.url;

    if (!downloadUrl) {
      throw new Error('Download URL not found');
    }

    const result = await this.downloadFile(downloadUrl);

    return result;
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

    return plainToInstance(RapidGatorDownloadResponseDto, data);
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

  async downloadFile(url: string): Promise<{
    data: Uint8Array | Readable;
    contentType: string;
    extension: string;
    contentLength?: number;
  }> {
    let response: Response;

    try {
      response = await fetch(url, {
        // ❗ KHÔNG set timeout ngắn
        // để server tự control
      });
    } catch (err) {
      throw new Error(`Fetch failed: ${err}`);
    }

    if (!response.ok) {
      throw new Error(`Failed: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength, 10) : 0;

    const MAX_MEMORY_SIZE = 50 * 1024 * 1024;

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    const extension = this.detectFileExtension(response, url, contentType);

    // ✅ SMALL FILE → BUFFER
    if (fileSize > 0 && fileSize <= MAX_MEMORY_SIZE) {
      const arrayBuffer = await response.arrayBuffer();

      return {
        data: new Uint8Array(arrayBuffer),
        contentType,
        extension,
        contentLength: fileSize,
      };
    }

    // ❗ STREAM FIX
    if (!response.body) {
      throw new Error('No response body');
    }

    const stream = Readable.fromWeb(response.body as any);

    // // ✅ BẮT ERROR STREAM (rất quan trọng)
    // stream.on('error', (err) => {
    //   // console.error('Stream error:', err);
    // });

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
