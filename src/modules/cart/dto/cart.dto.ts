import {
  IsInt,
  IsArray,
  Min,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CartItemDto {
  @ApiProperty({
    description: 'ID của món ăn',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  dishId: number;

  @ApiProperty({
    description: 'Số lượng món ăn',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Giá của món ăn',
    example: 75000,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: 'Tên món ăn',
    example: 'Phở bò đặc biệt',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Mô tả món ăn',
    example:
      'Phở bò truyền thống với nước dùng ngọt thanh từ xương bò hầm nhiều giờ',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Hình ảnh món ăn',
    example:
      'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/pho-bo.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({
    description: 'Danh mục món ăn',
    example: 'Món chính',
  })
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'Số lượng món ăn cần cập nhật',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CartResponseDto {
  @ApiProperty({
    description: 'ID duy nhất của giỏ hàng',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsString()
  cartId: string;

  @ApiProperty({
    description: 'Danh sách món ăn trong giỏ hàng',
    type: [CartItemDto],
    example: [
      {
        dishId: 1,
        quantity: 2,
        price: 75000,
        name: 'Phở bò đặc biệt',
        description:
          'Phở bò truyền thống với nước dùng ngọt thanh từ xương bò hầm nhiều giờ',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/pho-bo.jpg',
        category: 'Món chính',
      },
      {
        dishId: 3,
        quantity: 1,
        price: 45000,
        name: 'Gỏi cuốn tôm thịt',
        description: 'Gỏi cuốn với tôm tươi, thịt luộc, rau thơm và bún',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/goi-cuon.jpg',
        category: 'Món khai vị',
      },
    ],
  })
  @IsArray()
  items: CartItemDto[];

  @ApiProperty({
    description: 'Tổng giá trị giỏ hàng',
    example: 195000,
  })
  @IsNumber()
  totalPrice: number;

  @ApiProperty({
    description: 'Tổng số lượng món ăn trong giỏ hàng',
    example: 3,
  })
  @IsNumber()
  totalItems: number;
}
