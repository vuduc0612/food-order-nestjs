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
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

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
    example: 'Món chính', 
    description: 'Tên danh mục' 
  })
  category: string;

  @ApiProperty({ 
    example: 1, 
    description: 'ID nhà hàng' 
  })
  restaurantId: number;

  @ApiProperty({
    example: true,
    description: 'Trạng thái món ăn có sẵn',
    default: true,
  })
  isAvailable: boolean;
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
    example: true,
    description: 'Trạng thái món ăn có sẵn',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
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