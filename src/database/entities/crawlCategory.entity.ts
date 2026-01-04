import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { CrawlStatus } from '../../shared/constants/crawl.constant';
import { BaseEntity } from './base.entity';
import { CategoryEntity } from './category.entity';

@Entity('crawl_category')
export class CrawlCategoryEntity extends BaseEntity {
    @Column({
        length: 255,
        name: 'name',
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
        nullable: true,
    })
    public pageFrom?: number | null;

    @Column({
        type: 'bigint',
        name: 'page_to',
        nullable: true,
    })
    public pageTo?: number | null;

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
        name: 'number_of_post_crawled',
    })
    public numberOfPostCrawled: number;

    @Column({
        nullable: true,
        name: 'category_id',
    })
    public categoryId?: number;

    @ManyToOne(() => CategoryEntity, (category) => category.posts, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'category_id' })
    public category?: CategoryEntity;
}

