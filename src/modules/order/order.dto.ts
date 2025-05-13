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
    example: OrderStatus.CONFIRMED, 
    description: 'Order status',
    enum: OrderStatus
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

// DTOs mới cho response
export class OrderItemDto {
  @ApiProperty({ example: 1 })
  id: number;
  
  @ApiProperty({ example: 2 })
  dish_id: number;
  
  @ApiProperty({ example: 'Gà rán sốt cay' })
  dish_name: string;
  
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  dish_thumbnail: string;
  
  @ApiProperty({ example: 2 })
  quantity: number;
  
  @ApiProperty({ example: 75000 })
  price: number;
  
  @ApiProperty({ example: 150000 })
  subtotal: number;
}

export class RestaurantInfoDto {
  @ApiProperty({ example: 1 })
  id: number;
  
  @ApiProperty({ example: 'Nhà hàng ABC' })
  name: string;
  
  @ApiProperty({ example: 'https://example.com/restaurant.jpg' })
  image_url: string;
  
  @ApiProperty({ example: '123 Nguyễn Huệ, Quận 1, TP.HCM' })
  address: string;
  
  @ApiProperty({ example: '0123456789' })
  phone: string;
}

export class OrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;
  
  @ApiProperty({ example: 2 })
  user_id: number;
  
  @ApiProperty({ example: 3 })
  restaurant_id: number;
  
  @ApiProperty({ example: 165000 })
  total_price: number;
  
  @ApiProperty({ example: OrderStatus.PENDING, enum: OrderStatus })
  status: string;
  
  @ApiProperty({ example: 'Giao vào buổi trưa' })
  note: string;
  
  @ApiProperty()
  restaurant: RestaurantInfoDto;
  
  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[];
  
  @ApiProperty({ example: '2023-03-27T10:30:00.000Z' })
  created_at: Date;
  
  @ApiProperty({ example: '2023-03-27T10:45:00.000Z' })
  updated_at: Date;
  
  @ApiProperty({ example: 3 })
  totalItems: number;
}

export class OrdersPageResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  content: OrderResponseDto[];
  
  @ApiProperty({ example: 20 })
  total: number;
  
  @ApiProperty({ example: 0 })
  page: number;
  
  @ApiProperty({ example: 10 })
  size: number;
  
  @ApiProperty({ example: 2 })
  totalPages: number;
}
