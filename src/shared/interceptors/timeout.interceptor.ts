import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const timeout = this.reflector.get<number>('request-timeout', context.getHandler()) || 120000;
    response.setTimeout(timeout, () => {
      response.sendStatus(HttpStatus.REQUEST_TIMEOUT);
    });

    return next.handle();
  }
}
