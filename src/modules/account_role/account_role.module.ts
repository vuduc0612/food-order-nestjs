import { Module } from '@nestjs/common';
import { AccountRoleController } from './account_role.controller';
import { AccountRoleService } from './account_role.service';

@Module({
  controllers: [AccountRoleController],
  providers: [AccountRoleService]
})
export class AccountRoleModule {}
