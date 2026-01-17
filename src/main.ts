import { config } from 'dotenv';

config();

import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import helmet from 'helmet';
import { AppModule } from 'modules/app.module';
import { plainToInstanceOptions } from 'shared/constants/transform.constant';
import { ExceptionFilter } from 'shared/filters/exception.filter';
import { logger, morganMiddleware } from 'shared/logger/app.logger';
import { ApiValidationErrorException } from 'shared/types';

class App {
  public app: NestExpressApplication;
  public port: string | number;
  public env: string;

  constructor() {
    this.port = process.env.PORT || 3001;
    this.env = process.env.NODE_ENV || 'development';

    this.init();
  }

  private async init() {
    this.app = await NestFactory.create(AppModule);

    this.config();

    this.initAPIDocs();

    this.pipeValidation();

    this.initializeMiddleware();

    this.filterException();
    this.listen();
  }

  private config() {
    this.app.enableCors();
    this.app.use(helmet());
    this.app.use(json({ limit: '1mb' }));
  }

  private initAPIDocs() {
    if (process.env.API_DOC_STATUS !== 'public') {
      return;
    }

    const config = new DocumentBuilder()
      .setTitle('API document')
      .addBearerAuth()
      .setDescription('The API description')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(this.app, config);
    SwaggerModule.setup('api-docs', this.app, document, { swaggerOptions: { persistAuthorization: true } });
  }

  private pipeValidation() {
    this.app.useGlobalPipes(
      // new QueryTransformPipe(), //TODO - CHECK QUERY HAS CLASS TRANSFORM
      new ValidationPipe({
        transformOptions: plainToInstanceOptions,
        exceptionFactory: (exception) => {
          throw new ApiValidationErrorException(this.env === 'development' ? exception : undefined);
        },
      }),
    );
  }

  private initializeMiddleware() {
    this.app.use(morganMiddleware);
  }

  private filterException() {
    const { httpAdapter } = this.app.get(HttpAdapterHost);
    this.app.useGlobalFilters(new ExceptionFilter(httpAdapter));
  }

  public async listen() {
    await this.app.listen(this.port, () => {
      logger.info(`🚀 App listening on the port ${this.port}`);
    });
  }
}

new App();
