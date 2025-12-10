import { Module } from '@nestjs/common';
import { PersonalTokenRepository } from 'database/repositories/personalToken.repository';
import { UserRepository } from 'database/repositories/user.repository';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, PersonalTokenRepository],
})
export class AuthModule {}
