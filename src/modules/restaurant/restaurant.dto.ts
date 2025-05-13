import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { DishDto } from '../dish/dish.dto';

export class UpdateRestaurantDto {
  @ApiProperty({ example: 'Nhà hàng ABC', description: 'Tên nhà hàng' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Nhà hàng ngon nhất Hà Nội', description: 'Mô tả' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '123 Đường ABC, Hà Nội', description: 'Địa chỉ' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '0987654321', description: 'Số điện thoại' })
  @IsString()
  @IsOptional()
  @Length(10, 20)
  @Matches(/^[0-9+]+$/, { message: 'Số điện thoại chỉ được chứa số và dấu +' })
  phone?: string;

  @ApiProperty({ example: 'Nhà hàng Á', description: 'Loại nhà hàng' })
  @IsString()
  @IsOptional()
  type?: string;
}

export class RestaurantResponseDto {
  @ApiProperty({ example: 1, description: 'ID nhà hàng' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID tài khoản' })
  account_id: number;

  @ApiProperty({ example: 'Nhà hàng ABC', description: 'Tên nhà hàng' })
  name: string;

  @ApiProperty({ example: 'Nhà hàng ngon nhất Hà Nội', description: 'Mô tả' })
  description: string;

  @ApiProperty({ example: '123 Đường ABC, Hà Nội', description: 'Địa chỉ' })
  address: string;

  @ApiProperty({ example: '0987654321', description: 'Số điện thoại' })
  phone: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL ảnh',
  })
  image_url: string;

  @ApiProperty({ example: 'Nhà hàng Á', description: 'Loại nhà hàng' })
  type: string;

  @ApiProperty({ example: 'restaurant@example.com', description: 'Email' })
  email: string;

  @ApiProperty({
    type: [DishDto],
    description: 'Danh sách món ăn của nhà hàng',
    required: false,
  })
  dishes?: DishDto[];
}