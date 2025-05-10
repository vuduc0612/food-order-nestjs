import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { OrderStatus } from './enums/order-status.enum';

export class CreateOrderDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  @IsNumber()
  user_id: number;

  @ApiProperty({ example: 1, description: 'Restaurant ID' })
  @IsNumber()
  restaurant_id: number;

  @ApiProperty({ example: 150000, description: 'Total price' })
  @IsNumber()
  total_price: number;

  @ApiProperty({ 
    example: OrderStatus.PENDING, 
    description: 'Order status',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ 
    example: 'Please deliver to the back door', 
    description: 'Order note', 
    required: false 
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: '2025-03-27', description: 'Created at' })
  @IsString()
  created_at: Date;
}

export class UpdateOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  restaurant_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  total_price?: number;

  @ApiProperty({ 
    required: false,
    enum: OrderStatus
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  created_at?: Date;
}

export class CreateOrderNoteDto {
  @ApiProperty({ 
    example: 'Please deliver to the back door', 
    description: 'Order note', 
    required: false 
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ 
    example: OrderStatus.PROCESSING, 
    description: 'New order status',
    enum: OrderStatus
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
