import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlProcessDetailEntity, CrawlProcessEntity, UserEntity } from 'database/entities';
import { CrawlProcessRepository } from 'database/repositories/crawlProcess.repository';
import { CrawlProcessDetailRepository } from 'database/repositories/crawlProcessDetail.repository';
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
    TypeOrmModule.forFeature([UserEntity, CrawlProcessEntity, CrawlProcessDetailEntity]),
  ],
  providers: [UserRepository, CrawlProcessRepository, CrawlProcessDetailRepository],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
