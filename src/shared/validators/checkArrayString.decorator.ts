import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsString, ValidationOptions } from 'class-validator';
import { isNull } from 'lodash';

type Option = ValidationOptions & {
  min?: number;
  max?: number;
};

export function CheckArrayString(options: Option = {}) {
  const decorators: PropertyDecorator[] = [];

  decorators.push(IsArray);
  decorators.push(IsString({ each: true }));
  decorators.push(Transform(({ value }) => (isNull(value) ? [] : value)));

  if (options.min) {
    decorators.push(ArrayMinSize(options.min));
  }

  if (options.max) {
    decorators.push(ArrayMinSize(options.max));
  }

  return applyDecorators(...decorators);
}
