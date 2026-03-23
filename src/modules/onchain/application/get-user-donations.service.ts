import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { OnchainRepository } from '@onchain/infrastructure';
import { FindUserService } from '@users/application';

@Injectable()
export class GetUserDonationsService {
    constructor(
        private readonly onchainRepository: OnchainRepository,
        @Inject(forwardRef(() => FindUserService))
        private readonly findUserService: FindUserService,
    ) {}

    async execute(idOrUsername: string, limit: number = 20, offset: number = 0) {
        const user = await this.findUserService.findByIdOrUsername(idOrUsername);

        const [data, total] = await this.onchainRepository.findUserDonations(
            user.id,
            limit,
            offset,
        );

        return { data, total, limit, offset };
    }
}
