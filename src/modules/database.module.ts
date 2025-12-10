import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'database/entities';
import { UserRepository } from 'database/repositories/user.repository';

import { registerAsDatabase } from '../database/config.database';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [registerAsDatabase],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const result = configService.get('database');
        if (!result) {
          throw new Error('Database configuration not found');
        }

        return { ...result, autoLoadEntities: true };
      },
    }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  providers: [UserRepository],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
