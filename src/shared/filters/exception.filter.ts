import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { buildResponse } from 'shared/builders/response.builder';
import { Message, MessageCode } from 'shared/constants/app.constant';
import { HttpResponse } from 'shared/dto/response.dto';
import { logger } from 'shared/logger/app.logger';
import { ApiException } from 'shared/types/apiException.type';

@Catch()
export class ExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();

    try {
      if (!exception) {
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(buildResponse(this.getHttpResponse()));
      }

      const res = this.getHttpResponse(exception);
      if (exception instanceof TypeError) {
        logger.error(`StatusCode : ${res.statusCode}, Message : ${exception.message}, detail : ${exception.stack}`);
      } else {
        logger.error(`StatusCode : ${res.statusCode}, Message : ${res.message}`);
      }

      return response.status(res.statusCode).send(buildResponse(res));
    } catch (ex) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(buildResponse(this.getHttpResponse(ex)));
    }
  }

  private getHttpResponse(exception?: unknown) {
    console.log(exception);
    if (exception instanceof ApiException) {
      return this.apiExceptionResponse(exception);
    }

    return new HttpResponse({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      messageCode: MessageCode.generalError,
      message: Message.generalError,
    });
  }

  private apiExceptionResponse(exception: ApiException) {
    return new HttpResponse({
      success: false,
      statusCode: exception.statusCode,
      messageCode: exception.messageCode,
      message: exception.message,
      errors: exception.errors,
      validationErrors: exception.validationErrors,
    });
  }
}
