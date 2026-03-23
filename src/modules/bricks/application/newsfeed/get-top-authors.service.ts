import { Injectable } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';

@Injectable()
export class GetTopAuthorsService {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(limit: number = 10) {
        return this.userRepository.getTopAuthors(limit);
    }
}
