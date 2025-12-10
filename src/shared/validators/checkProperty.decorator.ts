import { applyDecorators } from '@nestjs/common';
import { IsBoolean, isDefined, IsIn, IsNumber, IsNumberString, IsString } from 'class-validator';
import {
  ExposeApiOptionalProperty,
  ExposeApiPropertyOptions,
  ExposeApiRequiredProperty,
} from 'shared/decorators/property.decorator';

import { CheckArrayBoolean } from './checkArrayBoolean.decorator';
import { CheckArrayEnum } from './checkArrayEnum.decorator';
import { CheckArrayNumber } from './checkArrayNumber.decorator';
import { CheckArrayNumberString } from './checkArrayNumberString.decorator';
import { CheckArrayRecord } from './checkArrayRecord.decorator';
import { CheckArrayString } from './checkArrayString.decorator';

const getArrayPrimitiveDecorator = (options: ExposeApiPropertyOptions = {}) => {
  switch (options.type) {
    case 'boolean':
      return CheckArrayBoolean({ min: options.minItems, max: options.maxItems });

    case 'number':
      return CheckArrayNumber({ min: options.minItems, max: options.maxItems });

    case 'number-string':
      return CheckArrayNumberString({ min: options.minItems, max: options.maxItems });

    default:
      return CheckArrayString({ min: options.minItems, max: options.maxItems });
  }
};

const getPrimitiveDecorator = (options: ExposeApiPropertyOptions = {}) => {
  switch (options.type) {
    case 'boolean':
      return IsBoolean();

    case 'number':
      return IsNumber();

    case 'number-string':
      return IsNumberString();

    default:
      return IsString();
  }
};

export function CheckApiProperty(options: ExposeApiPropertyOptions = {}) {
  const decorators: PropertyDecorator[] = [];

  if (options.required) {
    decorators.push(ExposeApiRequiredProperty(options));
  } else {
    decorators.push(ExposeApiOptionalProperty(options));
  }

  if (isDefined(options.enum)) {
    if (!options.isArray) {
      decorators.push(IsIn(Object.values(options.enum)));
    } else {
      decorators.push(CheckArrayEnum({ enum: options.enum, min: options.minItems, max: options.maxItems }));
    }
  }

  if (isDefined(options.type)) {
    if (typeof options.type === 'string' && !options.isArray) {
      decorators.push(getPrimitiveDecorator(options));
    }

    if (typeof options.type === 'string' && options.isArray) {
      decorators.push(getArrayPrimitiveDecorator(options));
    }

    if (typeof options.type === 'function' && options.isArray) {
      decorators.push(CheckArrayRecord({ min: options.minItems, max: options.maxItems }));
    }
  }

  return applyDecorators(...decorators);
}
