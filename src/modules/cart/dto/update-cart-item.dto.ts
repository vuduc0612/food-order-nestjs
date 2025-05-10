import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'Số lượng mới',
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  quantity: number;
} 