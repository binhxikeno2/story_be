import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { DatabaseModule } from './database.module';
import { QuestionModule } from './question/question.module';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, AuthModule, ContactModule, QuestionModule, AdminModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
