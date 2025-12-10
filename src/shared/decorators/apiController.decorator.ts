import { applyDecorators, Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { kebabCase } from 'lodash';
import { PermissionGuard } from 'shared/guards/permission.guard';

import { AuthRequired } from './authRequired.decorator';

type ApiControllerOptions = { authRequired?: boolean; name: string };

export function ApiController(options: ApiControllerOptions): ClassDecorator {
  const decorators: ClassDecorator[] = [];
  if (options.authRequired) {
    decorators.push(AuthRequired());
    decorators.push(UseGuards(PermissionGuard));
  }

  const name: string = options['name'];
  decorators.push(ApiTags(name));
  decorators.push(Controller(`api/v1/${kebabCase(name).toLowerCase()}`));

  return applyDecorators(...decorators);
}

export function ApiAdminController(options: ApiControllerOptions): ClassDecorator {
  const decorators: ClassDecorator[] = [];
  if (options.authRequired) {
    decorators.push(AuthRequired());
    decorators.push(UseGuards(PermissionGuard));
  }

  const name: string = options['name'];
  decorators.push(ApiTags(name));
  decorators.push(Controller(`api/v1/admin/${kebabCase(name).toLowerCase()}`));

  return applyDecorators(...decorators);
}
