import { ConfigService, registerAs } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

config();

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'mysql',
  host: configService.get('MYSQL_HOST'),
  port: configService.get('MYSQL_PORT'),
  username: configService.get('MYSQL_USER'),
  password: configService.get('MYSQL_ROOT_PASSWORD'),
  database: configService.get('MYSQL_DATABASE'),
  entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  seeds: [join(__dirname, 'seeders', '*.{ts,js}')],
  synchronize: false,
};

export const connectionSource = new DataSource(dataSourceOptions);
export const registerAsDatabase = registerAs('database', () => dataSourceOptions);
