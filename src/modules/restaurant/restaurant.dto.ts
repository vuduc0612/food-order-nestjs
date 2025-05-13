import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { DishDto } from '../dish/dish.dto';
import { CategoryResponseDto } from '../category/category.dto';

export class UpdateRestaurantDto {
  @ApiProperty({ example: 'Nhà hàng ABC', description: 'Tên nhà hàng' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Nhà hàng ngon nhất Hà Nội', description: 'Mô tả' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '123 Đường ABC, Hà Nội', description: 'Địa chỉ' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '0987654321', description: 'Số điện thoại' })
  @IsString()
  @IsOptional()
  @Length(10, 20)
  @Matches(/^[0-9+]+$/, { message: 'Số điện thoại chỉ được chứa số và dấu +' })
  phone?: string;
}

// DTO cơ bản cho nhà hàng, không bao gồm dishes và categories
export class RestaurantResponseDto {
  @ApiProperty({ example: 1, description: 'ID nhà hàng' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID tài khoản' })
  account_id: number;

  @ApiProperty({ example: 'Nhà hàng ABC', description: 'Tên nhà hàng' })
  name: string;

  @ApiProperty({ example: 'Nhà hàng ngon nhất Hà Nội', description: 'Mô tả' })
  description: string;

  @ApiProperty({ example: '123 Đường ABC, Hà Nội', description: 'Địa chỉ' })
  address: string;

  @ApiProperty({ example: '0987654321', description: 'Số điện thoại' })
  phone: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL ảnh',
  })
  image_url: string;

  @ApiProperty({ example: 'restaurant@example.com', description: 'Email' })
  email: string;
}

// DTO đầy đủ cho chi tiết nhà hàng, bao gồm dishes, categories và categoriesWithDishes
export class RestaurantDetailResponseDto extends RestaurantResponseDto {
  @ApiProperty({
    type: [DishDto],
    description: 'Danh sách món ăn của nhà hàng',
  })
  dishes: DishDto[];

  @ApiProperty({
    type: [CategoryResponseDto],
    description: 'Danh sách danh mục của nhà hàng',
  })
  categories: CategoryResponseDto[];

  @ApiProperty({
    type: [Object],
    description: 'Danh sách danh mục kèm món ăn',
    example: [
      {
        id: 1,
        name: 'Món chính',
        dishes: [
          {
            id: 1,
            name: 'Cơm rang',
            price: 50000,
            description: 'Cơm rang thập cẩm',
            thumbnail: 'https://example.com/com-rang.jpg',
            isAvailable: true
          }
        ]
      }
    ]
  })
  categoriesWithDishes: Array<{
    id: number;
    name: string;
    dishes: DishDto[];
  }>;
}

export class RestaurantPageDto {
  @ApiProperty({
    type: [RestaurantResponseDto],
    description: 'Danh sách nhà hàng'
  })
  content: RestaurantResponseDto[];

  @ApiProperty({
    example: 0,
    description: 'Trang hiện tại (bắt đầu từ 0)'
  })
  pageNumber: number;

  @ApiProperty({
    example: 10,
    description: 'Số lượng nhà hàng trên mỗi trang'
  })
  pageSize: number;

  @ApiProperty({
    example: 100,
    description: 'Tổng số nhà hàng'
  })
  totalElements: number;

  @ApiProperty({
    example: 10,
    description: 'Tổng số trang'
  })
  totalPages: number;
}
