import { Transform } from 'class-transformer';
import { isNotEmpty } from 'class-validator';

export const ToBoolean = () => Transform(({ value }) => value === 'true' || value === true);
export const ToBooleanOrUndefined = () =>
  Transform(({ value }) => (isNotEmpty(value) ? value === 'true' || value === true : undefined));
