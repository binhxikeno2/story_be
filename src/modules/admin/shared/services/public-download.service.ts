import { Injectable } from '@nestjs/common';
import { logger } from 'shared/logger/app.logger';

@Injectable()
export class PublicDownloadService {
  async downloadFile(url: string): Promise<{ data: Uint8Array; contentType: string }> {
    const response = await fetch(url);

    if (!response.ok) {
      const errorMessage = `Failed to download file: ${response.status} ${response.statusText}`;
      logger.error(`[PublicDownloadService] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return { data: uint8Array, contentType };
  }
}
