import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { PostEntity } from './post.entity';

@Entity('category')
export class CategoryEntity extends BaseEntity {
    @Column({ length: 150 })
    @Index({ unique: true })
    name: string;

    @Column({ length: 180 })
    @Index({ unique: true })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ length: 500, nullable: true })
    thumbnailUrl?: string;

    @Column({ length: 500, nullable: true })
    url3thParty?: string;

    @OneToMany(() => PostEntity, (post) => post.category)
    posts: PostEntity[];
}
