import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@redis/redis.service';
import { randomUUID, randomBytes, createHmac } from 'crypto';

@Injectable()
export class CreatePhotoSessionService {
    private readonly logger = new Logger(CreatePhotoSessionService.name);
    private readonly SESSION_TTL = 90; // seconds
    private readonly hmacSecret: string;

    constructor(
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {
        this.hmacSecret = this.configService.get<string>(
            'QR_HMAC_SECRET',
            'default-dev-secret-change-in-production',
        );
    }

    async execute(userId: string): Promise<{
        sessionId: string;
        qrToken: string;
        expiresIn: number;
    }> {
        const sessionId = randomUUID();
        const nonce = randomBytes(3).toString('hex').toUpperCase(); // e.g. "A91DFK"
        const timestamp = Date.now();

        // Create HMAC signature: HMAC-SHA256(secret, nonce|timestamp)
        const signature = createHmac('sha256', this.hmacSecret)
            .update(`${nonce}|${timestamp}`)
            .digest('hex');

        // Token payload → base64 JSON (FE renders this as QR code)
        const tokenPayload = { nonce, ts: timestamp, sig: signature };
        const qrToken = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

        const sessionData = {
            userId,
            nonce, // Store raw nonce in Redis for verification
            used: false,
        };

        await this.redisService.set(`photo-session:${sessionId}`, sessionData, this.SESSION_TTL);

        this.logger.log(`Photo session created: ${sessionId} for user ${userId}, nonce: ${nonce}`);

        return {
            sessionId,
            qrToken, // FE renders QR code from this token
            expiresIn: this.SESSION_TTL,
        };
    }
}
