import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';
import { PostModule } from './admin/post/post.module';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, AuthModule, AdminModule, PostModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
