import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { TimeoutInterceptor } from 'shared/interceptors/timeout.interceptor';

export function SetRequestTimeout(timeout = 120000) {
  return applyDecorators(SetMetadata('request-timeout', timeout), UseInterceptors(TimeoutInterceptor));
}
