import { HttpStatus } from '@nestjs/common';
import { HttpResponse } from 'shared/dto/response.dto';

export const buildSuccessResponse = <T>(response: HttpResponse<T>): any => {
  if (response instanceof HttpResponse) {
    response.success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR;

    return response;
  }

  const res: HttpResponse<T> = { success: true };
  res.statusCode = HttpStatus.OK;
  res.data = response;

  return res;
};

export const buildResponse = <T>(response: HttpResponse<T>): any => {
  if (response instanceof HttpResponse) {
    response.statusCode = response.statusCode || (response.success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR);

    return response;
  }

  const res: HttpResponse<T> = { success: true };
  res.statusCode = HttpStatus.OK;
  res.data = response;

  return res;
};
