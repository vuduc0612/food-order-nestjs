import { SetMetadata } from '@nestjs/common';
import { RoleType } from 'src/modules/account_role/enums/role-type.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
