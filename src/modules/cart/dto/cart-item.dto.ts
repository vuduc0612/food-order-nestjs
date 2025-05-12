import { ApiProperty } from '@nestjs/swagger';

export class CartItemDto {
  @ApiProperty({
    description: 'ID của món ăn',
    example: 1,
  })
  dishId: number;

  @ApiProperty({
    description: 'Số lượng',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Tên món ăn',
    example: 'Phở bò',
  })
  name: string;

  @ApiProperty({
    description: 'Giá món ăn',
    example: 50000,
  })
  price: number;

  @ApiProperty({
    description: 'Hình ảnh món ăn',
    example: 'https://example.com/pho.jpg',
    required: false,
  })
  image?: string;
} 