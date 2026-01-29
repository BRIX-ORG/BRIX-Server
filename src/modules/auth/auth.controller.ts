import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiExtraModels,
    getSchemaPath,
    ApiBody,
} from '@nestjs/swagger';
import { ApiResponseDto } from '@/common/dto/response.dto';
import {
    RegisterUserService,
    LoginUserService,
    RefreshTokenService,
    VerifyGoogleTokenService,
    ForgotPasswordService,
    VerifyOtpService,
    ResetPasswordService,
} from '@auth/application';
import {
    RegisterDto,
    LoginDto,
    AuthResponseDto,
    GoogleAuthDto,
    ForgotPasswordDto,
    VerifyOtpDto,
    ResetPasswordDto,
    RefreshTokenDto,
} from '@auth/dto';
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
        private readonly verifyGoogleTokenService: VerifyGoogleTokenService,
        private readonly forgotPasswordService: ForgotPasswordService,
        private readonly verifyOtpService: VerifyOtpService,
        private readonly resetPasswordService: ResetPasswordService,
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
    async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
        const result = await this.registerUserService.execute(registerDto);

        // response.cookie('accessToken', result.accessToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'strict',
        //     maxAge: 15 * 60 * 1000, // 15 minutes
        // });
        // response.cookie('refreshToken', result.refreshToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'strict',
        //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        // });

        return result;
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
    @ApiBody({ type: LoginDto })
    async login(@CurrentUser() user: UserEntity): Promise<AuthResponse> {
        // Complete login process (generate tokens, update DB)
        const result = await this.loginUserService.execute(user);

        // response.cookie('accessToken', result.accessToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'strict',
        //     maxAge: 15 * 60 * 1000, // 15 minutes
        // });
        // response.cookie('refreshToken', result.refreshToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'strict',
        //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        // });

        return result;
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
    @ApiBody({ type: RefreshTokenDto, required: false, description: 'Optional if sent via cookie' })
    async refresh(@Req() request: Request, @Body() body: RefreshTokenDto): Promise<AuthResponse> {
        const refreshToken =
            body.refreshToken || (request.cookies as Record<string, string>)['refreshToken'];
        const result = await this.refreshTokenService.execute(refreshToken);

        // response.cookie('accessToken', result.accessToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'strict',
        //     maxAge: 15 * 60 * 1000, // 15 minutes
        // });
        // response.cookie('refreshToken', result.refreshToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'strict',
        //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        // });

        return result;
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({
        status: 200,
        description: 'User successfully logged out',
        schema: {
            properties: {
                message: { type: 'string', example: 'Logged out successfully' },
            },
        },
    })
    logout(): { message: string } {
        // Clear both tokens from cookies
        // response.clearCookie('accessToken');
        // response.clearCookie('refreshToken');
        return { message: 'Logged out successfully' };
    }

    @Post('google')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Authenticate with Google (Firebase ID Token)' })
    @ApiResponse({
        status: 200,
        description: 'User successfully authenticated with Google',
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
        description: 'Invalid Firebase ID token',
    })
    @ApiResponse({
        status: 409,
        description: 'Email already exists with a different provider',
    })
    async googleAuth(@Body() dto: GoogleAuthDto): Promise<AuthResponse> {
        const result = await this.verifyGoogleTokenService.execute(dto.idToken);

        // response.cookie('accessToken', result.accessToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'strict',
        //     maxAge: 15 * 60 * 1000, // 15 minutes
        // });
        // response.cookie('refreshToken', result.refreshToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'strict',
        //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        // });

        return result;
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset (sends OTP to email)' })
    @ApiResponse({
        status: 200,
        description: 'Request processed (always returns 200 for security)',
        schema: {
            properties: {
                message: { type: 'string', example: 'If the email exists, an OTP has been sent' },
            },
        },
    })
    async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
        await this.forgotPasswordService.execute(dto.email);
        return { message: 'If the email exists, an OTP has been sent' };
    }

    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify OTP and get reset token' })
    @ApiResponse({
        status: 200,
        description: 'OTP verified successfully',
        schema: {
            properties: {
                resetToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid or expired OTP',
    })
    async verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ resetToken: string }> {
        return await this.verifyOtpService.execute(dto.email, dto.otp);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password with reset token' })
    @ApiResponse({
        status: 200,
        description: 'Password reset successfully',
        schema: {
            properties: {
                message: { type: 'string', example: 'Password reset successfully' },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid or expired reset token',
    })
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
        await this.resetPasswordService.execute(dto.email, dto.resetToken, dto.newPassword);
        return { message: 'Password reset successfully' };
    }
}
