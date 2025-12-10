import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateBy, ValidationOptions } from 'class-validator';
import { isNull } from 'lodash';

type Option = ValidationOptions & {
  enum: Record<string, any>;
  min?: number;
  max?: number;
};

function IsArrayEnumIn(value: Record<string, any>) {
  return ValidateBy(
    {
      name: 'isIn',
      validator: {
        validate(items: string[]) {
          return !items.find((item) => !Object.values(value).includes(item));
        },
      },
    },
    {
      message: (validationArguments) => {
        const property = validationArguments?.property || '';

        return `each value in ${property} must be one of the following values: ${Object.values(value)}`;
      },
    },
  );
}

export function CheckArrayEnum(options: Option) {
  const decorators: PropertyDecorator[] = [];

  decorators.push(IsArray);
  decorators.push(IsArrayEnumIn(options.enum));
  decorators.push(Transform(({ value }) => (isNull(value) ? [] : value)));

  if (options.min) {
    decorators.push(ArrayMinSize(options.min));
  }

  if (options.max) {
    decorators.push(ArrayMinSize(options.max));
  }

  return applyDecorators(...decorators);
}
