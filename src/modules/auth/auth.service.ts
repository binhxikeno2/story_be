import { Injectable } from '@nestjs/common';
import { UserEntity } from 'database/entities';
import { PersonalTokenRepository } from 'database/repositories/personalToken.repository';
import { UserRepository } from 'database/repositories/user.repository';
import { MessageCode, TimeConfig } from 'shared/constants/app.constant';
import { ApiBadRequestException, ApiUnauthorizedException } from 'shared/types';
import { checkHash, hashBcrypt } from 'shared/utils/bcrypt';
import { signData, verifyData } from 'shared/utils/jwt';

import { LoginReqDto, RenewReqDto, SignUpReqDto } from './dto/request.dto';
import { LoginResDto } from './dto/response.dto';

type PayloadToken = {
  id: number;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(private userRepository: UserRepository, private personalTokenRepository: PersonalTokenRepository) {}

  async signToken(user: UserEntity): Promise<LoginResDto> {
    const accessToken = signData<PayloadToken>({ id: user.id, email: user.email }, TimeConfig.accessToken);
    const refreshToken = signData<PayloadToken>({ id: user.id, email: user.email }, TimeConfig.refreshToken);

    const personalToken = await this.personalTokenRepository.save({
      token: refreshToken,
      expiresIn: TimeConfig.refreshToken.toString(),
      user,
    });

    return {
      accessToken,
      refreshToken: personalToken.token,
    };
  }

  async signIn(body: LoginReqDto): Promise<LoginResDto> {
    const user = await this.userRepository.findEmail(body.email);
    const compare = user ? await checkHash(body.password, user.password) : false;

    if (!compare || !user) {
      throw new ApiBadRequestException(MessageCode.wrongMailOrPassword);
    }

    return this.signToken(user);
  }

  async signUp(body: SignUpReqDto): Promise<void> {
    const user = await this.userRepository.findEmail(body.email);

    if (user) {
      throw new ApiBadRequestException(MessageCode.userExisted);
    }

    this.userRepository.save({
      ...body,
      password: await hashBcrypt(body.password),
    });
  }

  async renewToken(body: RenewReqDto): Promise<LoginResDto> {
    try {
      const { refreshToken } = body;

      const checkToken = verifyData<PayloadToken>(refreshToken);

      const personalToken = await this.personalTokenRepository.getPersonalTokenUser(refreshToken, checkToken.id);

      if (!personalToken?.isValidToken() || !personalToken?.user) {
        throw new ApiBadRequestException(MessageCode.invalidToken);
      }

      const accessToken = signData<PayloadToken>(
        { id: personalToken.user.id, email: personalToken.user.email },
        TimeConfig.accessToken,
      );

      return {
        accessToken,
        refreshToken: personalToken.token,
      };
    } catch (ex) {
      throw new ApiUnauthorizedException(MessageCode.expiredToken);
    }
  }
}
