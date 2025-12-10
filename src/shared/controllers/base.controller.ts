import { UseInterceptors } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { plainToInstanceOptions } from 'shared/constants/transform.constant';
import { ResponseInterceptor } from 'shared/interceptors/response.interceptor';

@UseInterceptors(ResponseInterceptor)
export class BaseController {
  public dataType<TRes = unknown>(type: ClassConstructor<TRes>, data?: unknown) {
    if (!data) {
      return {};
    }

    return plainToInstance(type, data, plainToInstanceOptions);
  }
}
