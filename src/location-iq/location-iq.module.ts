import { Module } from '@nestjs/common';
import { LocationIqController } from './location-iq.controller';
import { LocationIqService } from './location-iq.service';

@Module({
    controllers: [LocationIqController],
    providers: [LocationIqService],
    exports: [LocationIqService],
})
export class LocationIqModule {}
