import { NotificationType } from '@prisma/client';

export interface NotificationBatchData {
    actorsCount: number;
    lastActorId: string;
    actors: string[];
}

export interface NotificationFlushData {
    type: NotificationType;
    recipientId: string;
    brickId?: string;
    commentId?: string;
}
