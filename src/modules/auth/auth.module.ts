import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import {
    PasswordService,
    JwtTokenService,
    RegisterUserService,
    LoginUserService,
    RefreshTokenService,
    ValidateUserService,
    ValidateLocalUserService,
} from './application';
import { LocalStrategy } from './strategies';
import { JwtStrategy } from '@/common/strategies';
import { UsersModule } from '@users/users.module';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'default-secret',
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRES_IN') || '15m',
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        // Strategies
        LocalStrategy,
        JwtStrategy,
        // Application Services (Use Cases)
        PasswordService,
        JwtTokenService,
        RegisterUserService,
        LoginUserService,
        RefreshTokenService,
        ValidateUserService,
        ValidateLocalUserService,
    ],
    exports: [JwtTokenService, PasswordService],
})
export class AuthModule {}
