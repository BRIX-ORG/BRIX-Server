import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@redis/redis.service';
import { randomUUID, randomBytes } from 'crypto';

@Injectable()
export class CreatePhotoSessionService {
    private readonly logger = new Logger(CreatePhotoSessionService.name);
    private readonly SESSION_TTL = 90; // seconds

    constructor(private readonly redisService: RedisService) {}

    async execute(userId: string): Promise<{
        sessionId: string;
        nonce: string;
        expiresIn: number;
    }> {
        const sessionId = randomUUID();
        const rawNonce = randomBytes(3).toString('hex').toUpperCase(); // e.g. "A91DFK"
        const displayNonce = `BRX-${rawNonce}`; // e.g. "BRX-A91DFK"

        const sessionData = {
            userId,
            nonce: rawNonce, // Store raw nonce in Redis
            used: false,
        };

        await this.redisService.set(`photo-session:${sessionId}`, sessionData, this.SESSION_TTL);

        this.logger.log(
            `Photo session created: ${sessionId} for user ${userId}, nonce: ${displayNonce}`,
        );

        return {
            sessionId,
            nonce: displayNonce, // Return BRX-prefixed nonce to frontend
            expiresIn: this.SESSION_TTL,
        };
    }
}
