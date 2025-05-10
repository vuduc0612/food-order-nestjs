import { Type } from 'class-transformer';
import {
  IsInt,
  IsArray,
  ValidateNested,
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
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Giá của món ăn',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;
}

export class AddToCartDto {
  @ApiProperty({
    description: 'Danh sách món ăn muốn thêm vào giỏ hàng',
    type: [CartItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'Số lượng món ăn muốn cập nhật',
    example: 3,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CartResponseDto {
  @ApiProperty({
    description: 'ID của giỏ hàng',
    example: 'cart-123',
  })
  @IsString()
  cartId: string;

  @ApiProperty({
    description: 'Danh sách món ăn trong giỏ hàng',
    type: [CartItemDto],
  })
  @IsArray()
  items: CartItemDto[];

  @ApiProperty({
    description: 'Tổng giá trị giỏ hàng',
    example: 150000,
  })
  @IsNumber()
  totalPrice: number;

  @ApiProperty({
    description: 'Tổng số lượng món ăn trong giỏ hàng',
    example: 5,
  })
  @IsNumber()
  totalItems: number;
}
