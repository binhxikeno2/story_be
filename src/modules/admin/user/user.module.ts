import { Module } from '@nestjs/common';
import { UserRepository } from 'database/repositories/user.repository';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
