import { Controller, Post, Put, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
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
    LogoutUserService,
    RefreshTokenService,
    VerifyGoogleTokenService,
    ForgotPasswordService,
    VerifyOtpService,
    ResetPasswordService,
    EmailVerificationService,
    VerifyEmailOtpService,
} from '@auth/application';
import {
    RegisterDto,
    LoginDto,
    AuthResponseDto,
    GoogleAuthDto,
    ForgotPasswordDto,
    VerifyOtpDto,
    ResetPasswordDto,
    EmailVerificationDto,
    VerifyEmailDto,
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
        private readonly logoutUserService: LogoutUserService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly verifyGoogleTokenService: VerifyGoogleTokenService,
        private readonly forgotPasswordService: ForgotPasswordService,
        private readonly verifyOtpService: VerifyOtpService,
        private readonly resetPasswordService: ResetPasswordService,
        private readonly emailVerificationService: EmailVerificationService,
        private readonly verifyEmailOtpService: VerifyEmailOtpService,
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

    @Put('refresh')
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
    async refresh(@Req() request: Request): Promise<AuthResponse> {
        const authHeader = request.headers.authorization;
        const refreshToken = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : undefined;

        if (!refreshToken) {
            throw new Error('Refresh token not provided in Authorization header');
        }

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
    @ApiOperation({ summary: 'Logout user (invalidates refresh token)' })
    @ApiResponse({
        status: 200,
        description: 'User successfully logged out',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: {
                            type: 'object',
                            properties: {
                                message: { type: 'string', example: 'Logged out successfully' },
                            },
                        },
                    },
                },
            ],
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid or missing refresh token',
    })
    async logout(@Req() request: Request): Promise<{ message: string }> {
        const authHeader = request.headers.authorization;
        const refreshToken = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : undefined;

        if (!refreshToken) {
            return { message: 'Logged out successfully' };
        }

        return await this.logoutUserService.execute(refreshToken);
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
    @ApiBody({ type: GoogleAuthDto })
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
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: {
                            type: 'object',
                            properties: {
                                message: {
                                    type: 'string',
                                    example: 'If the email exists, an OTP has been sent',
                                },
                            },
                        },
                    },
                },
            ],
        },
    })
    @ApiBody({ type: ForgotPasswordDto })
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
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: {
                            type: 'object',
                            properties: {
                                resetToken: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                },
                            },
                        },
                    },
                },
            ],
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid or expired OTP',
    })
    @ApiBody({ type: VerifyOtpDto })
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
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: {
                            type: 'object',
                            properties: {
                                message: { type: 'string', example: 'Password reset successfully' },
                            },
                        },
                    },
                },
            ],
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid or expired reset token',
    })
    @ApiBody({ type: ResetPasswordDto })
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
        await this.resetPasswordService.execute(dto.email, dto.resetToken, dto.newPassword);
        return { message: 'Password reset successfully' };
    }

    @Post('verify-email/send')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Send email verification OTP' })
    @ApiResponse({
        status: 200,
        description: 'Verification OTP sent successfully',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: {
                            type: 'object',
                            properties: {
                                message: {
                                    type: 'string',
                                    example: 'Verification code sent to email',
                                },
                            },
                        },
                    },
                },
            ],
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Email not found, already verified, or not local auth',
    })
    @ApiBody({ type: EmailVerificationDto })
    async sendEmailVerification(@Body() dto: EmailVerificationDto): Promise<{ message: string }> {
        await this.emailVerificationService.execute(dto.email);
        return { message: 'Verification code sent to email' };
    }

    @Post('verify-email/verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify email with OTP' })
    @ApiResponse({
        status: 200,
        description: 'Email verified successfully',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: {
                            type: 'object',
                            properties: {
                                message: { type: 'string', example: 'Email verified successfully' },
                            },
                        },
                    },
                },
            ],
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid or expired OTP',
    })
    @ApiBody({ type: VerifyEmailDto })
    async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
        await this.verifyEmailOtpService.execute(dto.email, dto.otp);
        return { message: 'Email verified successfully' };
    }
}
