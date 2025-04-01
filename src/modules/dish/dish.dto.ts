import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateDishDto {
  @ApiProperty({ example: 1, description: 'Category ID' })
  @IsNumber()
  category_id: number;

  @ApiProperty({ example: 1, description: 'Restaurant ID' })
  @IsNumber()
  restaurant_id: number;

  @ApiProperty({ example: 'Pizza', description: 'Dish name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Delicious pizza', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 100000, description: 'Price' })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'http://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiProperty({ example: true, description: 'Is available' })
  @IsBoolean()
  is_available: boolean;

  @ApiProperty({ example: '2025-03-27', description: 'Created at' })
  @IsString()
  created_at: Date;
}

export class UpdateDishDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  category_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  restaurant_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  created_at?: Date;
}
