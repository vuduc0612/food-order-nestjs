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

export class CartItemDto {
  @IsInt()
  @IsNotEmpty()
  dishId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  price?: number;
}

export class AddToCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CartResponseDto {
  @IsString()
  cartId: string;

  @IsArray()
  items: CartItemDto[];

  @IsNumber()
  totalPrice: number;

  @IsNumber()
  totalItems: number;
}
