import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { CrawlProcessEntity } from './crawlProcess.entity';

export enum CrawlProcessDetailStatus {
  RUNNING = 'running',
  DONE = 'done',
  FAILED = 'failed',
}

@Entity('crawl_process_detail')
export class CrawlProcessDetailEntity extends BaseEntity {
  @Column({
    nullable: false,
    name: 'crawl_process_id',
  })
  public crawlProcessId: number;

  @ManyToOne(() => CrawlProcessEntity, (crawlProcess) => crawlProcess.details, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'crawl_process_id' })
  public crawlProcess?: CrawlProcessEntity;

  @Column({
    type: 'text',
    name: 'url',
  })
  public url: string;

  @Column({
    type: 'enum',
    enum: CrawlProcessDetailStatus,
    name: 'status',
  })
  public status: CrawlProcessDetailStatus;

  @Column({
    type: 'text',
    nullable: true,
    name: 'error',
  })
  public error?: string;

  @Column({
    type: 'integer',
    name: 'page',
  })
  public page: number;
}
