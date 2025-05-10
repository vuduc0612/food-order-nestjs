import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    description: 'ID của món ăn',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  dishId: number;

  @ApiProperty({
    description: 'Số lượng',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    description: 'Tên món ăn',
    example: 'Phở bò',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Giá món ăn',
    example: 50000,
  })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    description: 'Hình ảnh món ăn',
    example: 'https://example.com/pho.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  image?: string;
} 