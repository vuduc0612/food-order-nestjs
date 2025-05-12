import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
  IsUrl,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CategoryDto {
  @ApiProperty({ 
    example: 1, 
    description: 'ID danh mục' 
  })
  id: number;

  @ApiProperty({ 
    example: 'Món chính', 
    description: 'Tên danh mục' 
  })
  name: string;
}

export class RestaurantDto {
  @ApiProperty({ 
    example: 1, 
    description: 'ID nhà hàng' 
  })
  id: number;

  @ApiProperty({ 
    example: 'Nhà hàng ABC', 
    description: 'Tên nhà hàng' 
  })
  name: string;
}

export class DishDto {
  @ApiProperty({ 
    example: 1, 
    description: 'ID món ăn' 
  })
  id: number;

  @ApiProperty({ 
    example: 'Phở bò', 
    description: 'Tên món ăn' 
  })
  name: string;

  @ApiProperty({ 
    example: 'Món phở truyền thống', 
    description: 'Mô tả món ăn' 
  })
  description: string;

  @ApiProperty({ 
    example: 50000, 
    description: 'Giá món ăn' 
  })
  price: number;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL ảnh',
  })
  thumbnail: string;

  @ApiProperty({ 
    type: CategoryDto,
    description: 'Thông tin danh mục' 
  })
  @ValidateNested()
  category: string;

  @ApiProperty({ 
    type: RestaurantDto,
    description: 'Thông tin nhà hàng' 
  })
  @ValidateNested()
  restaurantId: number;

}

export class CreateDishDto {
  @ApiProperty({ 
    example: 'Phở bò', 
    description: 'Tên món ăn' 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    example: 'Món phở truyền thống', 
    description: 'Mô tả món ăn' 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({ 
    example: 50000, 
    description: 'Giá món ăn' 
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ 
    example: 'Món chính', 
    description: 'Tên danh mục' 
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL ảnh',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  thumbnail?: string;
  
  @ApiProperty({ 
    example: 1, 
    description: 'ID của nhà hàng (bắt buộc khi tạo món ăn không có đăng nhập)',
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsNumber()
  restaurantId?: number;
}

export class UpdateDishDto {
  @ApiProperty({
    example: 'Phở bò',
    description: 'Tên món ăn',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    example: 'Món phở truyền thống',
    description: 'Mô tả món ăn',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ 
    example: 50000, 
    description: 'Giá món ăn',
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value;
    }
    
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    
    return value;
  })
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    example: 'Món chính',
    description: 'Tên danh mục',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL ảnh',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  thumbnail?: string;

  @ApiProperty({
    example: true,
    description: 'Trạng thái món ăn có sẵn',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class PageDto<T> {
  @ApiProperty({ 
    description: 'Dữ liệu trả về' 
  })
  content: T[];

  @ApiProperty({ 
    example: 1, 
    description: 'Trang hiện tại' 
  })
  number: number;

  @ApiProperty({ 
    example: 10, 
    description: 'Số lượng item trên một trang' 
  })
  size: number;

  @ApiProperty({ 
    example: 100, 
    description: 'Tổng số item' 
  })
  totalElements: number;

  @ApiProperty({ 
    example: 10, 
    description: 'Tổng số trang' 
  })
  totalPages: number;
} 