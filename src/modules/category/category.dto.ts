import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Món chính', description: 'Tên danh mục' })
  @IsString()
  name: string;
}

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Món chính', description: 'Tên danh mục' })
  @IsString()
  @IsOptional()
  name?: string;
}

export class CategoryResponseDto {
  @ApiProperty({ example: 1, description: 'ID của danh mục' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID của nhà hàng' })
  restaurant_id: number;

  @ApiProperty({ example: 'Món chính', description: 'Tên danh mục' })
  name: string;
}
