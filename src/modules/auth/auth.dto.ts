import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, IsEnum } from 'class-validator';

export enum UserRole {
  CUSTOMER = 1,
  RESTAURANT = 2,
}

export class RegisterDto {
  @ApiProperty({ example: 'Nguyen Van A', description: 'Tên người dùng' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email hợp lệ' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'strongpassword123', description: 'Mật khẩu' })
  @IsString()
  @Length(6, 50)
  password: string;

  @ApiProperty({
    example: UserRole.CUSTOMER,
    description: 'Vai trò người dùng',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  @IsEnum(UserRole)
  role: UserRole;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email đã đăng ký' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'strongpassword123', description: 'Mật khẩu' })
  @IsString()
  @Length(6, 50)
  password: string;

  @ApiProperty({
    example: UserRole.CUSTOMER,
    description: 'Vai trò người dùng',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  @IsEnum(UserRole)
  role: UserRole;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email để nhận OTP',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email đã nhận OTP',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP 6 chữ số' })
  @IsString()
  @Length(6, 6)
  otp: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email đã nhận OTP',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP hợp lệ' })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ example: 'newstrongpassword123', description: 'Mật khẩu mới' })
  @IsString()
  @Length(6, 50)
  newPassword: string;
}
