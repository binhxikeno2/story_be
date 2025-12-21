import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { CategoryEntity } from './category.entity';

export enum CrawlStatus {
    IN_PROGRESS = 'inprogress',
    CRAWLED = 'crawled',
    ERROR = 'error',
}

@Entity('crawl_process')
export class CrawlProcessEntity extends BaseEntity {
    @Column({
        length: 255,
    })
    public name: string;

    @Column({
        type: 'enum',
        enum: CrawlStatus,
        default: null,
        name: 'status',
    })
    public status: CrawlStatus;

    @Column({
        type: 'bigint',
        name: 'limit_time',
        nullable: true,
    })
    public limitTime: number;

    @Column({
        type: 'timestamp',
        name: 'started_at',
    })
    public startedProcessAt: Date;

    @Column({
        type: 'timestamp',
        name: 'ended_process_at',
        nullable: true,
    })
    public endedProcessAt: Date;

    @Column({
        type: 'bigint',
        nullable: true,
    })
    public numberOfPostCrawled: number;

    @Column({ nullable: true })
    public categoryId?: number;

    @ManyToOne(() => CategoryEntity, (category) => category.posts, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'categoryId' })
    public category?: CategoryEntity;
}
