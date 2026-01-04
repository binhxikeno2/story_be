import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';

@Module({
  imports: [ConfigModule.forRoot(), ScheduleModule.forRoot(), DatabaseModule, AuthModule, AdminModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
