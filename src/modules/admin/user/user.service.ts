import { Injectable } from '@nestjs/common';
import { UserRepository } from 'database/repositories/user.repository';
import { Message, MessageCode } from 'shared/constants/app.constant';
import { ApiBadRequestException } from 'shared/types';

import { CreateUserReqDto, UserReqDto } from './dto/request';
import { UserEntity } from 'database/entities';
import { IsNull } from 'typeorm';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) { }

  public getUsers(query: UserReqDto) {
    return this.userRepository.getUsers<UserReqDto>(query);
  }

  public async createUser(body: CreateUserReqDto): Promise<UserEntity> {
    const checkUser = await this.userRepository.findOne({ withDeleted: true, where: { name: body.name, email: body.email } })

    if (!!checkUser) {
      throw new ApiBadRequestException(MessageCode.userExisted);
    }

    return this.userRepository.save(body);
  }

  public async destroyUser(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: id } });

    if (!user) {
      throw new ApiBadRequestException(MessageCode.userNotFound);
    }

    this.userRepository.softDelete(id);
  }
}
