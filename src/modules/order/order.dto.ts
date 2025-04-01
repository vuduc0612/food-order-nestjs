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
