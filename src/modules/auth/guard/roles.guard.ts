import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { RoleType } from 'src/modules/account_role/enums/role-type.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    console.log('Required roles:', requiredRoles);
    console.log('User:', request.user);
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('Bạn không có quyền truy cập.!');
    }
    // console.log('User roles:', user.roles); // thêm dòng này

    const hasRole = requiredRoles.some((role) =>
      user.roles.map(String).includes(String(role)),
    );
    // Kiểm tra xem user có vai trò nào trong requiredRoles không
    // console.log('Has matching role?', hasRole); // thêm dòng này
    if (!hasRole) {
      throw new ForbiddenException('Bạn không đủ quyền!.');
    }

    return true;

    // const { user } = context.switchToHttp().getRequest();
    // return requiredRoles.includes(user.user_role);
  }
}
