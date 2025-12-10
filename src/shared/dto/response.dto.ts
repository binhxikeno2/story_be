import { ValidationError } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MessageCode } from 'shared/constants/app.constant';
import { ExposeApiProperty } from 'shared/decorators/property.decorator';
import { ApiErrorDescription } from 'shared/types';

export class HttpResponse<T> {
  @ApiPropertyOptional()
  statusCode?: number;

  @ApiPropertyOptional()
  messageCode?: MessageCode;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional({ type: Object })
  data?: T;

  @ApiPropertyOptional()
  errors?: ApiErrorDescription;

  @ApiPropertyOptional()
  validationErrors?: ValidationError[];

  @ApiPropertyOptional()
  success?: boolean;

  constructor(data?: Partial<HttpResponse<T>>) {
    Object.assign(this, data);
  }
}

export class PaginationMetaData {
  @ExposeApiProperty()
  page?: number;

  @ExposeApiProperty()
  perPage?: number;

  @ExposeApiProperty()
  total?: number;
}

export class Pagination<T> {
  @ExposeApiProperty()
  items: T;

  @ExposeApiProperty()
  pagination?: PaginationMetaData;
}

export class BaseBaseResDto {
  @ExposeApiProperty()
  id: string;

  @ExposeApiProperty()
  createdAt: string;

  @ExposeApiProperty()
  updatedAt: string;
}
