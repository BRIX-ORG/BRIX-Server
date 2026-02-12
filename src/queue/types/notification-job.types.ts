export enum NotificationJobType {
    FLUSH = 'flush-notification',
}

import { NotificationType } from '@prisma/client';

export interface NotificationFlushData {
    type: NotificationType;
    recipientId: string;
    brickId?: string;
    commentId?: string;
    groupId?: string;
    baseKey?: string;
}

export type NotificationJobData = { type: NotificationJobType.FLUSH; data: NotificationFlushData };
