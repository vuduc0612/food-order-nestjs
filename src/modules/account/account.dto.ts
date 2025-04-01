import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: '', description: 'Username' })
  @IsString()
  username: string;

  @ApiProperty({ example: '', description: 'Password' })
  @IsString()
  password: string;

  @ApiProperty({ example: '', description: 'Role ID' })
  @IsNumber()
  role_id: number;

  @ApiProperty({ example: '', description: 'Email' })
  @IsString()
  email: string;

  @ApiProperty({ example: '', description: 'Phone', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '', description: 'Created at' })
  @IsString()
  created_at: Date;
}

export class UpdateAccountDto {
  @ApiProperty({ example: '', description: 'Username', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: '', description: 'Password', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: '', description: 'Role ID', required: false })
  @IsOptional()
  @IsNumber()
  role_id?: number;

  @ApiProperty({ example: '', description: 'Email', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: '', description: 'Phone', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '', description: 'Created at', required: false })
  @IsOptional()
  @IsString()
  created_at?: Date;
}
