import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiBearerAuth,
    ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '@users/domain';
import {
    GetWalletNonceService,
    LinkWalletService,
    UnlinkWalletService,
    GetUserWalletsService,
} from './application';
import { LinkWalletDto, WalletResponseDto, WalletNonceResponseDto } from './dto';

@ApiTags('Wallets')
@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletsController {
    constructor(
        private readonly getNonceService: GetWalletNonceService,
        private readonly linkWalletService: LinkWalletService,
        private readonly unlinkWalletService: UnlinkWalletService,
        private readonly getWalletsService: GetUserWalletsService,
    ) {}

    @Get('nonce')
    @ApiOperation({ summary: 'Get a random nonce message to sign for wallet linking' })
    @ApiOkResponse({ type: WalletNonceResponseDto })
    async getNonce(@CurrentUser() user: UserEntity): Promise<WalletNonceResponseDto> {
        return this.getNonceService.execute(user.id);
    }

    @Post('link')
    @ApiOperation({ summary: 'Verify signature and link a new wallet address' })
    @ApiCreatedResponse({ type: WalletResponseDto })
    async linkWallet(
        @CurrentUser() user: UserEntity,
        @Body() dto: LinkWalletDto,
    ): Promise<WalletResponseDto> {
        return this.linkWalletService.execute(user.id, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all linked wallets for the current user' })
    @ApiOkResponse({ type: [WalletResponseDto] })
    async getMyWallets(@CurrentUser() user: UserEntity): Promise<WalletResponseDto[]> {
        return this.getWalletsService.execute(user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Unlink a wallet address' })
    @ApiResponse({ status: 204, description: 'Wallet unlinked' })
    async unlinkWallet(@CurrentUser() user: UserEntity, @Param('id') id: string): Promise<void> {
        return this.unlinkWalletService.execute(user.id, id);
    }
}
