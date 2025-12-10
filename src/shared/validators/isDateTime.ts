import { applyDecorators } from '@nestjs/common';
import { ValidateBy } from 'class-validator';

function IsDateSlashed(separator?: string) {
  return ValidateBy({
    name: 'isDateSlashed',
    validator: {
      validate(value: string) {
        const arr = value.split(separator ?? '-');

        return arr.length === 3 && !isNaN(Date.parse(value));
      },
    },
  });
}

export function IsDateTime(options: { required?: boolean; separator?: string }) {
  const decorators: PropertyDecorator[] = [];
  decorators.push(IsDateSlashed(options.separator));

  return applyDecorators(...decorators);
}
