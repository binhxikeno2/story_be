import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { CrawlStatus } from '../../shared/constants/crawl.constant';

import { BaseEntity } from './base.entity';
import { CrawlProcessEntity } from './crawlProcess.entity';

@Entity('crawl_process_page')
@Index(['processId', 'pageNo'], { unique: true })
@Index(['processId', 'status'])
export class CrawlProcessPageEntity extends BaseEntity {
    @Column({ type: 'bigint', name: 'process_id' })
    public processId: number;

    @ManyToOne(() => CrawlProcessEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'process_id' })
    public process: CrawlProcessEntity;

    @Column({ type: 'bigint', name: 'page_no' })
    public pageNo: number;

    @Column({ type: 'varchar', length: 800, name: 'url' })
    public url: string;

    @Column({
        type: 'enum',
        enum: CrawlStatus,
        default: CrawlStatus.PENDING,
        name: 'status',
    })
    public status: CrawlStatus;

    @Column({ type: 'bigint', nullable: true, name: 'found_count' })
    public foundCount?: number;

    @Column({ type: 'text', nullable: true, name: 'last_error' })
    public lastError?: string;

    @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
    public startedAt?: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'ended_at' })
    public endedAt?: Date;
}
