import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from '@/modules/users';
import { UserCleanupJob } from './jobs';

@Module({
    imports: [ScheduleModule.forRoot(), UsersModule],
    providers: [UserCleanupJob],
})
export class CronModule {}
