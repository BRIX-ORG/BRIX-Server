import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '@users/domain';
import {
    VoteBrickService,
    VoteCommentService,
    GetBrickUpvotersService,
    GetCommentUpvotersService,
    GetBrickVoteStatusService,
    GetCommentVoteStatusService,
} from '@bricks/application';
import { CastVoteDto, VoteResponseDto, UpvoterResponseDto } from '@bricks/dto';

@ApiTags('Bricks')
@Controller('bricks')
export class BrickVotesController {
    constructor(
        private readonly voteBrickService: VoteBrickService,
        private readonly voteCommentService: VoteCommentService,
        private readonly getBrickUpvotersService: GetBrickUpvotersService,
        private readonly getCommentUpvotersService: GetCommentUpvotersService,
        private readonly getBrickVoteStatusService: GetBrickVoteStatusService,
        private readonly getCommentVoteStatusService: GetCommentVoteStatusService,
    ) {}

    // ─── Vote Brick ──────────────────────────────────────────────────────────

    @Post(':id/vote')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Upvote or downvote a brick',
        description:
            'Send value=1 to upvote, value=-1 to downvote. ' +
            'Sending the same value again removes the vote (toggle off). ' +
            'Sending the opposite value flips the vote.',
    })
    @ApiBody({ type: CastVoteDto })
    @ApiResponse({ status: 200, description: 'Vote recorded.', type: VoteResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Brick not found.' })
    async voteBrick(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CastVoteDto,
    ): Promise<VoteResponseDto> {
        return await this.voteBrickService.execute(id, user.id, dto.value);
    }

    @Get(':id/votes')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get vote status for a brick',
        description:
            'Returns upvote/downvote counts, net score, and current user vote (if authenticated).',
    })
    @ApiResponse({ status: 200, description: 'Vote status.', type: VoteResponseDto })
    async getBrickVotes(
        @CurrentUser() user: UserEntity | undefined,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<VoteResponseDto> {
        return this.getBrickVoteStatusService.execute(id, user?.id);
    }

    @Get(':id/upvoters')
    @ApiOperation({ summary: 'Get list of users who upvoted this brick' })
    @ApiResponse({
        status: 200,
        description: 'List of upvoters.',
        type: [UpvoterResponseDto],
    })
    @ApiResponse({ status: 404, description: 'Brick not found.' })
    async getBrickUpvoters(@Param('id', ParseUUIDPipe) id: string): Promise<UpvoterResponseDto[]> {
        const users = await this.getBrickUpvotersService.execute(id);
        return users.map((u) => UpvoterResponseDto.fromEntity(u));
    }

    // ─── Comment Vote ─────────────────────────────────────────────────────────

    @Post('comments/:commentId/vote')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Upvote or downvote a comment',
        description:
            'Send value=1 to upvote, value=-1 to downvote. ' +
            'Sending the same value again removes the vote (toggle off). ' +
            'Sending the opposite value flips the vote.',
    })
    @ApiBody({ type: CastVoteDto })
    @ApiResponse({ status: 200, description: 'Vote recorded.', type: VoteResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Comment not found.' })
    async voteComment(
        @CurrentUser() user: UserEntity,
        @Param('commentId', ParseUUIDPipe) commentId: string,
        @Body() dto: CastVoteDto,
    ): Promise<VoteResponseDto> {
        return await this.voteCommentService.execute(commentId, user.id, dto.value);
    }

    @Get('comments/:commentId/upvoters')
    @ApiOperation({ summary: 'Get list of users who upvoted this comment' })
    @ApiResponse({
        status: 200,
        description: 'List of upvoters.',
        type: [UpvoterResponseDto],
    })
    @ApiResponse({ status: 404, description: 'Comment not found.' })
    async getCommentUpvoters(
        @Param('commentId', ParseUUIDPipe) commentId: string,
    ): Promise<UpvoterResponseDto[]> {
        const users = await this.getCommentUpvotersService.execute(commentId);
        return users.map((u) => UpvoterResponseDto.fromEntity(u));
    }

    @Get('comments/:commentId/votes')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get vote status for a comment',
        description:
            'Returns upvote/downvote counts, net score, and current user vote (if authenticated).',
    })
    @ApiResponse({ status: 200, description: 'Vote status.', type: VoteResponseDto })
    async getCommentVotes(
        @CurrentUser() user: UserEntity | undefined,
        @Param('commentId', ParseUUIDPipe) commentId: string,
    ): Promise<VoteResponseDto> {
        return this.getCommentVoteStatusService.execute(commentId, user?.id);
    }
}
