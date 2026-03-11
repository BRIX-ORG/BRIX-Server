import { Injectable } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';

@Injectable()
export class GetUserLocationsService {
    constructor(private readonly userRepository: UserRepository) {}

    async execute() {
        return await this.userRepository.findUserLocations();
    }
}
