import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { CrawlProcessDetailEntity } from './crawlProcessDetail.entity';
import { PostEntity } from './post.entity';

@Entity('crawl_process_detail_post_link')
export class CrawlProcessDetailPostLinkEntity extends BaseEntity {
  @Column({
    nullable: false,
    name: 'crawl_process_detail_id',
    unique: true,
  })
  public crawlProcessDetailId: number;

  @OneToOne(() => CrawlProcessDetailEntity, {
    nullable: false,
  })
  @JoinColumn({ name: 'crawl_process_detail_id' })
  public crawlProcessDetail?: CrawlProcessDetailEntity;

  @Column({
    nullable: false,
    name: 'post_id',
    unique: true,
  })
  public postId: number;

  @OneToOne(() => PostEntity, {
    nullable: false,
  })
  @JoinColumn({ name: 'post_id' })
  public post?: PostEntity;
}
