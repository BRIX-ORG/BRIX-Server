import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ValidateLocalUserService } from '@auth/application/validate-local-user.service';
import type { UserEntity } from '@users/domain';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly validateLocalUserService: ValidateLocalUserService) {
        super({
            usernameField: 'identifier',
            passwordField: 'password',
        });
    }

    async validate(identifier: string, password: string): Promise<UserEntity> {
        return this.validateLocalUserService.execute(identifier, password);
    }
}
