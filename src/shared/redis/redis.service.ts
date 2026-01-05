import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { logger } from 'shared/logger/app.logger';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private client: Redis;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
        const port = this.configService.get<number>('REDIS_PORT') || 6379;
        const password = this.configService.get<string>('REDIS_PASSWORD');

        this.client = new Redis({
            host,
            port,
            password,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);

                return delay;
            },
        });

        this.client.on('connect', () => {
            logger.info('[RedisService] Connected to Redis');
        });

        this.client.on('error', (error) => {
            logger.error('[RedisService] Redis error:', error);
        });
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.client.setex(key, ttl, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(key);

        return result === 1;
    }

    async getJson<T>(key: string): Promise<T | null> {
        const value = await this.get(key);

        return value ? JSON.parse(value) : null;
    }

    async setJson(key: string, value: any, ttl?: number): Promise<void> {
        await this.set(key, JSON.stringify(value), ttl);
    }

    onModuleDestroy() {
        this.client.quit();
    }
}

