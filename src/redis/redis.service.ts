import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: Redis;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('REDIS_HOST', 'localhost');
        const port = this.configService.get<number>('REDIS_PORT', 6379);
        const password = this.configService.get<string>('REDIS_PASSWORD');
        const db = this.configService.get<number>('REDIS_DB', 0);

        this.client = new Redis({
            host,
            port,
            password,
            db,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        this.client.on('connect', () => {
            this.logger.log('Redis connected successfully');
        });

        this.client.on('error', (error) => {
            this.logger.error('Redis connection error', error);
        });
    }

    onModuleInit() {
        // Initialization moved to constructor to support early usage in WebSocketAdapter
    }

    async onModuleDestroy() {
        await this.client.quit();
    }

    async get<T>(key: string): Promise<T | null> {
        const value = await this.client.get(key);
        if (!value) return null;
        return JSON.parse(value) as T;
    }

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        const stringValue = JSON.stringify(value);
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, stringValue);
        } else {
            await this.client.set(key, stringValue);
        }
    }

    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }

    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(key);
        return result === 1;
    }

    async increment(key: string): Promise<number> {
        return await this.client.incr(key);
    }

    async hIncrBy(key: string, field: string, increment: number): Promise<number> {
        return await this.client.hincrby(key, field, increment);
    }

    async sAdd(key: string, ...members: string[]): Promise<number> {
        return await this.client.sadd(key, ...members);
    }

    async sMembers(key: string): Promise<string[]> {
        return await this.client.smembers(key);
    }
    async sRem(key: string, ...members: string[]): Promise<number> {
        return await this.client.srem(key, ...members);
    }

    async sCard(key: string): Promise<number> {
        return await this.client.scard(key);
    }

    async sIsMember(key: string, member: string): Promise<boolean> {
        const result = await this.client.sismember(key, member);
        return result === 1;
    }

    async zAdd(key: string, score: number, member: string): Promise<number> {
        return await this.client.zadd(key, score, member);
    }

    async zRem(key: string, ...members: string[]): Promise<number> {
        return await this.client.zrem(key, ...members);
    }

    async zRangeByScore(
        key: string,
        min: number | string,
        max: number | string,
    ): Promise<string[]> {
        return await this.client.zrangebyscore(key, min, max);
    }

    async zRemRangeByScore(
        key: string,
        min: number | string,
        max: number | string,
    ): Promise<number> {
        return await this.client.zremrangebyscore(key, min, max);
    }

    async hSet(key: string, field: string, value: string): Promise<number> {
        return await this.client.hset(key, field, value);
    }

    async hGetAll(key: string): Promise<Record<string, string>> {
        return await this.client.hgetall(key);
    }

    async expire(key: string, ttlSeconds: number): Promise<void> {
        await this.client.expire(key, ttlSeconds);
    }

    getClient(): Redis {
        return this.client;
    }
}
