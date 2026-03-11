import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { AlgoliaService } from '@/algolia';
import { PrismaService } from '@/prisma';

async function bootstrap() {
    console.log('Bootstrapping Nest context for Algolia Reindex...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const algoliaService = app.get(AlgoliaService);
    const prismaService = app.get(PrismaService);

    console.log('Starting Algolia Reindex...');

    try {
        // Users
        const users = await prismaService.user.findMany();
        console.log(`Found ${users.length} users. Syncing...`);
        let syncedUsers = 0;
        for (const user of users) {
            await algoliaService.syncUser(user.id);
            syncedUsers++;
            if (syncedUsers % 10 === 0) {
                console.log(`Synced ${syncedUsers}/${users.length} users...`);
            }
        }
        console.log(`Finished syncing all users.`);

        // Bricks
        const bricks = await prismaService.brick.findMany();
        console.log(`Found ${bricks.length} bricks. Syncing...`);
        let syncedBricks = 0;
        for (const brick of bricks) {
            await algoliaService.syncBrick(brick.id);
            syncedBricks++;
            if (syncedBricks % 10 === 0) {
                console.log(`Synced ${syncedBricks}/${bricks.length} bricks...`);
            }
        }
        console.log(`Finished syncing all bricks.`);

        console.log('Algolia Reindex Complete.');
    } catch (error) {
        console.error('Error during reindex:', error);
    } finally {
        await app.close();
    }
}

bootstrap().catch((err) => {
    console.error('Fatal error during bootstrap:', err);
    process.exit(1);
});
