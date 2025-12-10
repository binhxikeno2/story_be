import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { isEmpty } from 'lodash';
import { Message, MessageCode } from 'shared/constants/app.constant';

export class ApiErrorDescription {
  [property: string]: string[];
}

export class ApiException {
  constructor(
    public statusCode: HttpStatus,
    public messageCode?: MessageCode,
    public message?: string,
    public errors?: ApiErrorDescription,
    public validationErrors?: ValidationError[],
  ) {}
}

export class ApiNotFoundException extends ApiException {
  constructor(messageCode?: MessageCode, message?: string) {
    super(HttpStatus.NOT_FOUND, messageCode ?? MessageCode.notFound, message);
  }
}

export class ApiUnauthorizedException extends ApiException {
  constructor(messageCode?: MessageCode, message?: string) {
    super(HttpStatus.UNAUTHORIZED, messageCode, message);
  }
}

export class ApiForbiddenException extends ApiException {
  constructor(messageCode?: MessageCode, message?: string) {
    super(HttpStatus.FORBIDDEN, messageCode, message);
  }
}

export class ApiBadRequestException extends ApiException {
  constructor(messageCode?: MessageCode, message?: string, errors?: ApiErrorDescription) {
    super(HttpStatus.BAD_REQUEST, messageCode, message, errors);
  }

  static checkErrorDescription(errors: ApiErrorDescription, messageCode?: MessageCode, message?: string) {
    if (!isEmpty(errors)) {
      throw new ApiBadRequestException(
        messageCode ?? MessageCode.invalidInput,
        message ?? Message.invalidInput,
        errors ?? [],
      );
    }
  }
}

export class ApiValidationErrorException extends ApiException {
  constructor(validationErrors?: ValidationError[]) {
    super(HttpStatus.BAD_REQUEST, MessageCode.invalidInput, Message.invalidInput, undefined, validationErrors);
  }
}

export class ApiInternalErrorException extends ApiException {
  constructor(messageCode?: MessageCode, message?: string) {
    super(HttpStatus.INTERNAL_SERVER_ERROR, messageCode, message);
  }
}
