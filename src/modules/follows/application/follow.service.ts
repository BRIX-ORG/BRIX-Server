import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { FollowRepository } from '@follows/infrastructure';
import { FindUserService } from '@users/application';
import { NotificationBatchService } from '@notifications/application';
import { NotificationType } from '@prisma/client';

@Injectable()
export class FollowService {
    constructor(
        private readonly followRepository: FollowRepository,
        private readonly findUserService: FindUserService,
        private readonly notificationBatchService: NotificationBatchService,
    ) {}

    async follow(followerId: string, followingId: string): Promise<{ isFollowing: boolean }> {
        // Validate not following self
        if (followerId === followingId) {
            throw new BadRequestException('You cannot follow yourself');
        }

        // Validate target user exists
        try {
            await this.findUserService.findById(followingId);
        } catch {
            throw new NotFoundException(`User with ID "${followingId}" not found`);
        }

        // Check if already following
        const isAlreadyFollowing = await this.followRepository.isFollowing(followerId, followingId);
        if (isAlreadyFollowing) {
            throw new ConflictException('You are already following this user');
        }

        await this.followRepository.follow(followerId, followingId);

        // Trigger notification (batched)
        await this.notificationBatchService.addNotification({
            type: NotificationType.FOLLOW,
            recipientId: followingId,
            actorId: followerId,
        });

        return { isFollowing: true };
    }

    async unfollow(followerId: string, followingId: string): Promise<{ isFollowing: boolean }> {
        // Validate not unfollowing self
        if (followerId === followingId) {
            throw new BadRequestException('You cannot unfollow yourself');
        }

        // Check if following
        const isFollowing = await this.followRepository.isFollowing(followerId, followingId);
        if (!isFollowing) {
            throw new NotFoundException('You are not following this user');
        }

        await this.followRepository.unfollow(followerId, followingId);
        return { isFollowing: false };
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        return this.followRepository.isFollowing(followerId, followingId);
    }
}
