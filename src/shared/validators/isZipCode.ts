import { applyDecorators } from '@nestjs/common';
import { Matches } from 'class-validator';
import { RegularExpression } from 'shared/constants/app.constant';

export function IsZipCode() {
  const decorators: PropertyDecorator[] = [];
  decorators.push(Matches(RegularExpression.zip));

  return applyDecorators(...decorators);
}
