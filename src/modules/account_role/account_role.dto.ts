import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateAccountRoleDto {
  @ApiProperty({ example: 'ADMIN', description: 'Mã vai trò' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Quản trị viên', description: 'Tên vai trò' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Người quản lý toàn hệ thống', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAccountRoleDto {
  @ApiProperty({ example: 'Quản trị viên', description: 'Tên vai trò' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Mô tả cập nhật', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
