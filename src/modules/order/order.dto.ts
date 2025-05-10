import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

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

  @ApiProperty({ example: 'pending', description: 'Order status' })
  @IsString()
  status: string;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  created_at?: Date;
}

export class CheckoutDto {
  @ApiProperty({ example: 'Delivery instructions here', description: 'Note for the order', required: false })
  @IsOptional()
  @IsString()
  note?: string;
  
  @ApiProperty({ example: '123 Main St, City', description: 'Delivery address', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

export class OrderResponseDto {
  @ApiProperty({ example: 1, description: 'Order ID' })
  id: number;
  
  @ApiProperty({ example: 1, description: 'User ID' })
  user_id: number;
  
  @ApiProperty({ example: 1, description: 'Restaurant ID' })
  restaurant_id: number;
  
  @ApiProperty({ example: 150000, description: 'Total price' })
  total_price: number;
  
  @ApiProperty({ example: 'pending', description: 'Order status' })
  status: string;
  
  @ApiProperty({ example: 'Delivery instructions', description: 'Note for the order', required: false })
  note?: string;
  
  @ApiProperty({ example: '2023-03-27T15:30:00Z', description: 'Created at' })
  created_at: Date;
  
  @ApiProperty({ example: null, description: 'Updated at', required: false })
  updated_at?: Date;
  
  @ApiProperty({ type: 'array', description: 'Order details', required: false })
  orderDetails?: any[];
}
