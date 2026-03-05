/**
 * Represents a conversation between two users.
 */
export interface Conversation {
    id: string;
    user1Id: string;
    user2Id: string;
    user1HiddenAt: Date | null;
    user2HiddenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
