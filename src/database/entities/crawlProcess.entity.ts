import { Column, Entity } from 'typeorm';

import { BaseEntity } from './base.entity';

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
        type: 'timestamp',
        name: 'started_at',
    })
    public startedProcessAt: Date;

    @Column({
        type: 'timestamp',
        name: 'ended_process_at',
    })
    public endedProcessAt: Date;

    @Column({
        type: 'bigint',
        nullable: true,
    })
    public numberOfPostCrawled: number;
}
