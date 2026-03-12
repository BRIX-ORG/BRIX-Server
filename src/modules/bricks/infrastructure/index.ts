export * from './brick.repository';
export * from './brick-vote.repository';
export * from './comment.repository';
export * from './comment-vote.repository';

// Re-export types for backward compatibility
export type {
    FindBricksFilter,
    FindNewsfeedBricksFilter,
    FindBrickLocationsFilter,
    FindFollowingBricksFilter,
} from '@bricks/domain';
export type { BrickVoteResult } from './brick-vote.repository';
export type { CommentVoteResult } from './comment-vote.repository';
