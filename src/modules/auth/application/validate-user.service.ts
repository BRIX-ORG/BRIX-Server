import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { JwtPayload } from '@auth/domain';
import { UserEntity } from '@users/domain';

@Injectable()
export class ValidateUserService {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(payload: JwtPayload): Promise<UserEntity> {
        const user = await this.userRepository.findById(payload.sub);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user;
    }
}
