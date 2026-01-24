import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { CrawlProcessDetailEntity } from './crawlProcessDetail.entity';

export enum CrawlProcessStatus {
  CREATED = 'created',
  RUNNING = 'running',
  DONE = 'done',
  FAILED = 'failed',
  SKIP = 'skip',
}

export interface CrawlProcessRange {
  pageFrom: number;
  pageTo: number;
  pageFound: number;
}

export interface CrawlProcessStats {
  totalPage: number;
  crawled: number;
}

@Entity('crawl_process')
export class CrawlProcessEntity extends BaseEntity {
  @Column({
    type: 'enum',
    enum: CrawlProcessStatus,
    name: 'status',
  })
  public status: CrawlProcessStatus;

  @Column({
    type: 'json',
    nullable: true,
    name: 'range',
  })
  public range?: CrawlProcessRange;

  @Column({
    type: 'json',
    nullable: true,
    name: 'stats',
  })
  public stats?: CrawlProcessStats;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'lasted_at',
  })
  public lastedAt?: Date;

  @Column({
    type: 'text',
    nullable: true,
    name: 'error',
  })
  public error?: string;

  @OneToMany(() => CrawlProcessDetailEntity, (detail) => detail.crawlProcess, { cascade: true })
  public details?: CrawlProcessDetailEntity[];
}
