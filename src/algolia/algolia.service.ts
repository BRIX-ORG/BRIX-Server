import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { algoliasearch, SearchClient } from 'algoliasearch';
import { PrismaService } from '@/prisma';
import { User, Brick } from '@prisma/client';

export type BrickWithUser = Brick & { user: User };

@Injectable()
export class AlgoliaService implements OnModuleInit {
    private readonly logger = new Logger(AlgoliaService.name);
    private client: SearchClient | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {}

    onModuleInit() {
        const appId = this.configService.get<string>('algolia.appId');
        const adminKey = this.configService.get<string>('algolia.adminKey');

        if (!appId || !adminKey) {
            this.logger.error(
                'Algolia configuration is missing. Search functionality will not work.',
            );
            return;
        }

        try {
            this.client = algoliasearch(appId, adminKey);
            this.logger.log('Algolia client initialized successfully.');
        } catch (error: unknown) {
            this.logger.error(
                `Failed to initialize Algolia client: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    private mapUserToRecord(user: User) {
        const address = user.address as Record<string, unknown> | null;
        const _geoloc =
            address?.lat &&
            typeof address.lat === 'string' &&
            address?.lon &&
            typeof address.lon === 'string'
                ? { lat: Number(address.lat), lng: Number(address.lon) }
                : undefined;

        return {
            objectID: user.id,
            fullname: user.fullName,
            username: user.username,
            avatar: user.avatar,
            background: user.background,
            gender: user.gender,
            _geoloc,
        };
    }

    async syncUser(userId: string): Promise<void> {
        if (!this.client) return;
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) return;

            const record = this.mapUserToRecord(user);
            await this.client.saveObject({ indexName: 'users', body: record });

            // Sync all bricks for this user to update flattened user info
            await this.syncBricksByUser(user.id);
        } catch (error: unknown) {
            this.logger.error(
                'Failed to sync user to Algolia:',
                error instanceof Error ? error.message : String(error),
            );
        }
    }

    async removeUser(userId: string): Promise<void> {
        if (!this.client) return;
        try {
            await this.client.deleteObject({ indexName: 'users', objectID: userId });
        } catch (error: unknown) {
            this.logger.error(
                `Failed to remove user ${userId} from Algolia:`,
                error instanceof Error ? error.message : String(error),
            );
        }
    }

    private mapBrickToRecord(brick: BrickWithUser) {
        return {
            objectID: brick.id,
            watermark: brick.watermark,
            thumbnails: brick.thumbnail,
            media: brick.media,
            mediaType: brick.mediaType,
            tagType: brick.tagType,
            userId: brick.userId,
            latitude: brick.latitude ? Number(brick.latitude) : null,
            longitude: brick.longitude ? Number(brick.longitude) : null,
            _geoloc:
                brick.latitude && brick.longitude
                    ? { lat: Number(brick.latitude), lng: Number(brick.longitude) }
                    : undefined,
            title: brick.title,
            createdAt: brick.createdAt.getTime(),
            description: brick.description,
            generativeDescription: brick.generatedDescription,
            isPublic: brick.isPublic,

            // Flattened User Info
            fullname: brick.user?.fullName || null,
            username: brick.user?.username || null,
            avatar: brick.user?.avatar || null,
            gender: brick.user?.gender || null,
        };
    }

    async syncBrick(brickId: string): Promise<void> {
        if (!this.client) return;
        try {
            const brick = await this.prisma.brick.findUnique({
                where: { id: brickId },
                include: { user: true },
            });
            if (!brick || !brick.user || !brick.isPublic) {
                await this.removeBrick(brickId);
                return;
            }

            const record = this.mapBrickToRecord(brick as BrickWithUser);
            await this.client.saveObject({ indexName: 'bricks', body: record });
        } catch (error: unknown) {
            this.logger.error(
                'Failed to sync brick to Algolia:',
                error instanceof Error ? error.message : String(error),
            );
        }
    }

    async removeBrick(brickId: string): Promise<void> {
        if (!this.client) return;
        try {
            await this.client.deleteObject({ indexName: 'bricks', objectID: brickId });
        } catch (error: unknown) {
            this.logger.error(
                `Failed to remove brick ${brickId} from Algolia:`,
                error instanceof Error ? error.message : String(error),
            );
        }
    }

    /**
     * Resyncs all bricks for a particular user to ensure flattened user information is strictly up to date
     */
    async syncBricksByUser(userId: string): Promise<void> {
        if (!this.client) return;
        try {
            const bricks = await this.prisma.brick.findMany({
                where: { userId },
                include: { user: true },
            });

            if (bricks.length === 0) return;

            const records = bricks
                .filter((brick) => brick.user && brick.isPublic)
                .map((brick) => this.mapBrickToRecord(brick as BrickWithUser));

            if (records.length > 0) {
                await this.client.saveObjects({
                    indexName: 'bricks',
                    objects: records,
                });
                this.logger.log(`Synced ${records.length} bricks for user ${userId} to Algolia`);
            }
        } catch (error: unknown) {
            this.logger.error(
                `Failed to sync bricks for user ${userId} to Algolia:`,
                error instanceof Error ? error.message : String(error),
            );
        }
    }
}
