import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { RoleType } from './enums/role-type.enum';

export class CreateAccountRoleDto {
  @ApiProperty({
    example: RoleType.ADMIN,
    description: 'Mã vai trò',
    enum: RoleType,
  })
  @IsEnum(RoleType)
  code: RoleType;

  @ApiProperty({ example: 'Quản trị viên', description: 'Tên vai trò' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Người quản lý toàn hệ thống', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAccountRoleDto {
  @ApiProperty({
    example: RoleType.ADMIN,
    description: 'Mã vai trò',
    enum: RoleType,
    required: false,
  })
  @IsOptional()
  @IsEnum(RoleType)
  code?: RoleType;

  @ApiProperty({
    example: 'Quản trị viên',
    description: 'Tên vai trò',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Người quản lý toàn hệ thống', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
