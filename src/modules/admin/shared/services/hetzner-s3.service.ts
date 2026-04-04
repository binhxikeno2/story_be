import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from 'shared/logger/app.logger';

export type MultipartCompletedPart = { ETag: string; PartNumber: number };

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

  public getPublicUrlForKey(key: string): string | null {
    if (!this.s3Client) {
      return null;
    }

    return `https://${this.s3Bucket}.${this.s3Endpoint}/${key}`;
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
        ContentLength: body.length,
        ACL: acl,
      }),
    );

    const s3Url = this.getPublicUrlForKey(key);
    logger.info(`[HetznerS3Service] Successfully uploaded file to ${s3Url}`);

    return s3Url;
  }

  public async createMultipartUpload(params: {
    key: string;
    contentType: string;
    acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  }): Promise<{ uploadId: string }> {
    if (!this.s3Client) {
      throw new Error('[HetznerS3Service] S3 client is not configured');
    }

    const { key, contentType, acl = 'public-read' } = params;
    const out = await this.s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.s3Bucket,
        Key: key,
        ContentType: contentType,
        ACL: acl,
      }),
    );

    if (!out.UploadId) {
      throw new Error('[HetznerS3Service] createMultipartUpload missing UploadId');
    }

    return { uploadId: out.UploadId };
  }

  public async uploadPart(params: {
    key: string;
    uploadId: string;
    partNumber: number;
    body: Uint8Array;
  }): Promise<{ etag: string }> {
    if (!this.s3Client) {
      throw new Error('[HetznerS3Service] S3 client is not configured');
    }

    const { key, uploadId, partNumber, body } = params;
    const out = await this.s3Client.send(
      new UploadPartCommand({
        Bucket: this.s3Bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: body,
        ContentLength: body.byteLength,
      }),
    );

    if (!out.ETag) {
      throw new Error(`[HetznerS3Service] uploadPart missing ETag for part ${partNumber}`);
    }

    return { etag: out.ETag };
  }

  public async completeMultipartUpload(params: {
    key: string;
    uploadId: string;
    parts: MultipartCompletedPart[];
  }): Promise<void> {
    if (!this.s3Client) {
      throw new Error('[HetznerS3Service] S3 client is not configured');
    }

    const { key, uploadId, parts } = params;
    const sorted = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

    await this.s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.s3Bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sorted.map((p) => ({ ETag: p.ETag, PartNumber: p.PartNumber })),
        },
      }),
    );

    logger.info(`[HetznerS3Service] Multipart upload completed for key=${key}`);
  }

  public async abortMultipartUpload(params: { key: string; uploadId: string }): Promise<void> {
    if (!this.s3Client) {
      return;
    }

    const { key, uploadId } = params;

    try {
      await this.s3Client.send(
        new AbortMultipartUploadCommand({
          Bucket: this.s3Bucket,
          Key: key,
          UploadId: uploadId,
        }),
      );
      logger.warn(`[HetznerS3Service] Aborted multipart upload uploadId=${uploadId} key=${key}`);
    } catch (e) {
      logger.error(`[HetznerS3Service] abortMultipartUpload failed: ${e}`);
    }
  }
}
