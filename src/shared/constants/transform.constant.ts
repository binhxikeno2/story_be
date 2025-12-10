import { ClassTransformOptions } from 'class-transformer';

export const plainToInstanceOptions: ClassTransformOptions = {
  strategy: 'excludeAll',
  excludeExtraneousValues: true,
  exposeUnsetFields: false,
  enableImplicitConversion: true,
};
