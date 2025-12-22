import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { CrawlStatus } from '../../shared/constants/crawl.constant';
import { BaseEntity } from './base.entity';
import { CategoryEntity } from './category.entity';

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
        type: 'bigint',
        name: 'page_from',
    })
    public pageFrom: number;

    @Column({
        type: 'bigint',
        name: 'page_to',
    })
    public pageTo: number;

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
