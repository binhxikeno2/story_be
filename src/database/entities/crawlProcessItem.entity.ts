import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { CrawlStatus } from '../../shared/constants/crawl.constant';
import { BaseEntity } from './base.entity';
import { CrawlProcessPageEntity } from './crawlProcessPage.entity';
import { PostEntity } from './post.entity';

@Entity('crawl_process_item')
export class CrawlProcessItemEntity extends BaseEntity {
    @Column({ type: 'bigint', name: 'process_page_id' })
    public processPageId: number;

    @ManyToOne(() => CrawlProcessPageEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'process_page_id' })
    public processPage: CrawlProcessPageEntity;

    @Column({ type: 'varchar', length: 1000, name: 'detail_url' })
    public detailUrl: string;

    @Column({
        type: 'enum',
        enum: CrawlStatus,
        default: CrawlStatus.PENDING,
        name: 'status',
    })
    public status: CrawlStatus;

    @Column({ type: 'bigint', nullable: true, name: 'post_id' })
    public postId?: number;

    @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'post_id' })
    public post?: PostEntity;

    @Column({ type: 'text', nullable: true, name: 'last_error' })
    public lastError?: string;

    @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
    public startedAt?: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'ended_at' })
    public endedAt?: Date;
}
