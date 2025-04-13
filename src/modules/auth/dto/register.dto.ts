import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, IsOptional, MinLength, Matches } from 'class-validator';
import { RoleType } from '../../account_role/enums/role-type.enum';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: RoleType, example: RoleType.CUSTOMER })
  @IsEnum(RoleType)
  role: RoleType;

  @ApiProperty({ example: 'Nhà hàng ABC', required: false })
  @IsOptional()
  @IsString()
  restaurant_name?: string;

  @ApiProperty({ example: 'Mô tả nhà hàng', required: false })
  @IsOptional()
  @IsString()
  restaurant_description?: string;

  @ApiProperty({ example: '123 Đường ABC', required: false })
  @IsOptional()
  @IsString()
  restaurant_address?: string;

  @ApiProperty({ example: '+84123456789', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,20}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  restaurant_phone?: string;
} 