import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Nguyen Van A', description: 'Họ tên người dùng' })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiProperty({ example: '0987654321', description: 'Số điện thoại' })
  @IsString()
  @IsOptional()
  @Length(10, 20)
  @Matches(/^[0-9+]+$/, { message: 'Số điện thoại chỉ được chứa số và dấu +' })
  phone?: string;

  @ApiProperty({ example: 'Hà Nội', description: 'Địa chỉ' })
  @IsString()
  @IsOptional()
  address?: string;
}

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'ID người dùng' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID tài khoản' })
  account_id: number;

  @ApiProperty({ example: 'Nguyen Van A', description: 'Họ tên người dùng' })
  full_name: string;

  @ApiProperty({ example: '0987654321', description: 'Số điện thoại' })
  phone: string;

  @ApiProperty({ example: 'Hà Nội', description: 'Địa chỉ' })
  address: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL ảnh đại diện',
  })
  avatar: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  email: string;
}
