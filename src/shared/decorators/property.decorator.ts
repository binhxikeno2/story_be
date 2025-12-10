import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import { ClassConstructor, Expose, Type } from 'class-transformer';
import { isDefined, IsNotEmpty, IsOptional } from 'class-validator';

export type PrimitiveOptions = 'boolean' | 'string' | 'number' | 'number-string';

export type ExposeApiPropertyOptions = Omit<ApiPropertyOptions, 'type' | 'enum'> & {
  type?: ClassConstructor<Record<string, any>> | PrimitiveOptions;
  enum?: Record<string, any>;
};

export function ExposeApiProperty({ type, ...options }: ExposeApiPropertyOptions = {}) {
  const decorators: PropertyDecorator[] = [];

  if (isDefined(type) && typeof type === 'function') {
    decorators.push(Type(() => type));
  }

  decorators.push(Expose({ name: options.name }));
  decorators.push(ApiProperty({ type, ...options }));

  return applyDecorators(...decorators);
}

export function ExposeApiRequiredProperty(options: ExposeApiPropertyOptions = {}) {
  const decorators: PropertyDecorator[] = [];

  decorators.push(ExposeApiProperty({ ...options, required: true }));
  decorators.push(IsNotEmpty());

  return applyDecorators(...decorators);
}

export function ExposeApiOptionalProperty(options: ExposeApiPropertyOptions = {}) {
  const decorators: PropertyDecorator[] = [];

  decorators.push(ExposeApiProperty({ ...options, required: false }));
  decorators.push(IsOptional());

  return applyDecorators(...decorators);
}
