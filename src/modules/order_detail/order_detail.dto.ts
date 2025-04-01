import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateOrderDetailDto {
  @ApiProperty({ example: 1, description: 'Order ID' })
  @IsNumber()
  order_id: number;

  @ApiProperty({ example: 2, description: 'Dish ID' })
  @IsNumber()
  dish_id: number;

  @ApiProperty({ example: 3, description: 'Quantity' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 50000, description: 'Price' })
  @IsNumber()
  price: number;
}

export class UpdateOrderDetailDto {
  @ApiProperty({ required: false })
  @IsNumber()
  order_id?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  dish_id?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  price?: number;
}
