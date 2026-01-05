import { Column, Entity } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity('playwright_session')
export class PlaywrightSessionEntity extends BaseEntity {
    @Column({
        type: 'text',
        name: 'cookies',
    })
    public cookies: string;

    @Column({
        length: 1000,
        name: 'url',
    })
    public url: string;

    @Column({
        length: 500,
        nullable: true,
        name: 'title',
    })
    public title?: string;

    @Column({
        type: 'boolean',
        default: false,
        name: 'is_verified',
    })
    public isVerified: boolean;

    @Column({
        type: 'timestamp',
        nullable: true,
        name: 'expires_at',
    })
    public expiresAt?: Date;
}

