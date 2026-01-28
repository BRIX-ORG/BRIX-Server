import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto } from '@/common/dto/response.dto';
import { RegisterUserService, LoginUserService, RefreshTokenService } from '@auth/application';
import { RegisterDto, AuthResponseDto } from '@auth/dto';
import { LocalAuthGuard } from '@auth/guards';
import { CurrentUser } from '@/common';
import type { Response, Request } from 'express';
import type { AuthResponse } from '@auth/domain';
import type { UserEntity } from '@users/domain';

@ApiTags('Authentication')
@Controller('auth')
@ApiExtraModels(ApiResponseDto, AuthResponseDto)
export class AuthController {
    constructor(
        private readonly registerUserService: RegisterUserService,
        private readonly loginUserService: LoginUserService,
        private readonly refreshTokenService: RefreshTokenService,
    ) {}

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({
        status: 201,
        description: 'User successfully registered. Returns access and refresh tokens.',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(AuthResponseDto) },
                    },
                },
            ],
        },
    })
    @ApiResponse({
        status: 409,
        description: 'Email or username already exists',
    })
    async register(
        @Body() registerDto: RegisterDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<AuthResponse> {
        const result = await this.registerUserService.execute(registerDto);

        // Set access token as httpOnly cookie
        response.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Set refresh token as httpOnly cookie
        response.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // In development, return tokens for debugging
        // In production, only return success message (tokens are in httpOnly cookies)
        if (process.env.NODE_ENV === 'development') {
            return result;
        }
        return {
            accessToken: 'Set in cookie',
            refreshToken: 'Set in cookie',
        };
    }

    @Post('login')
    @UseGuards(LocalAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with username or email' })
    @ApiResponse({
        status: 200,
        description: 'User successfully logged in. Returns access and refresh tokens.',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(AuthResponseDto) },
                    },
                },
            ],
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid credentials',
    })
    async login(
        @CurrentUser() user: UserEntity,
        @Res({ passthrough: true }) response: Response,
    ): Promise<AuthResponse> {
        // Complete login process (generate tokens, update DB)
        const result = await this.loginUserService.execute(user);

        // Set access token as httpOnly cookie
        response.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Set refresh token as httpOnly cookie
        response.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // In development, return tokens for debugging
        if (process.env.NODE_ENV === 'development') {
            return result;
        }
        return {
            accessToken: 'Set in cookie',
            refreshToken: 'Set in cookie',
        };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({
        status: 200,
        description: 'Token successfully refreshed',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(AuthResponseDto) },
                    },
                },
            ],
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid refresh token',
    })
    async refresh(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<AuthResponse> {
        const refreshToken = (request.cookies as Record<string, string>)['refreshToken'];
        const result = await this.refreshTokenService.execute(refreshToken);

        // Set new access token as httpOnly cookie
        response.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Update refresh token cookie
        response.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // In development, return tokens for debugging
        // In production, only return success message (tokens are in httpOnly cookies)
        if (process.env.NODE_ENV === 'development') {
            return result;
        }
        return {
            accessToken: 'Set in cookie',
            refreshToken: 'Set in cookie',
        };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({
        status: 200,
        description: 'User successfully logged out',
    })
    logout(@Res({ passthrough: true }) response: Response): { message: string } {
        // Clear both tokens from cookies
        response.clearCookie('accessToken');
        response.clearCookie('refreshToken');
        return { message: 'Logged out successfully' };
    }
}
