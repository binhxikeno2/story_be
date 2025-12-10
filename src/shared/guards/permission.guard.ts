import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.get<{ menuCode: string; value: number }>('auth_permission', context.getHandler());

    if (!permission) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const value = user?.permissions[permission.menuCode] || 0;

    return (permission.value & value) != 0;
  }
}
