import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from 'shared/logger/app.logger';

@Injectable()
export class HetznerS3Service {
  private readonly s3Client?: S3Client;
  private readonly s3Bucket: string;
  private readonly s3Endpoint: string;
  private readonly s3Region: string;

  constructor(private readonly configService: ConfigService) {
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
    } else {
      logger.warn('[HetznerS3Service] HETZNER_S3 is not fully configured. S3 upload will be disabled.');
    }
  }

  public async upload(params: {
    body: Uint8Array;
    key: string;
    contentType?: string;
    acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  }): Promise<string | null> {
    if (!this.s3Client) {
      return null;
    }

    const { body, key, contentType = 'application/octet-stream', acl = 'public-read' } = params;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: acl,
      }),
    );

    const s3Url = `https://${this.s3Bucket}.${this.s3Endpoint}/${key}`;
    logger.info(`[HetznerS3Service] Successfully uploaded file to ${s3Url}`);

    return s3Url;
  }
}
