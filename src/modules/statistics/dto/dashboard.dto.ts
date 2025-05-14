import { ApiProperty } from '@nestjs/swagger';

export enum TimeFilterType {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export class DailyRevenueDto {
  @ApiProperty({ description: 'Ngày', example: '2025-05-14' })
  date: string;

  @ApiProperty({ description: 'Doanh thu', example: 2241 })
  revenue: number;
  
  @ApiProperty({ description: 'Số lượng đơn hàng', example: 12 })
  orderCount: number;
}

export class MonthlyRevenueDto {
  @ApiProperty({ description: 'Tháng', example: '2025-05' })
  month: string;

  @ApiProperty({ description: 'Doanh thu', example: 12500 })
  revenue: number;
  
  @ApiProperty({ description: 'Số lượng đơn hàng', example: 120 })
  orderCount: number;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Số lượng đơn hàng đã hoàn thành (COMPLETED)', example: 20 })
  runningOrders: number;

  @ApiProperty({ description: 'Số lượng đơn hàng đang chờ xử lý (PENDING, PROCESSING, NEW)', example: 5 })
  orderRequests: number;

  @ApiProperty({ description: 'Tổng doanh thu hôm nay', example: 2241 })
  todayRevenue: number;

  @ApiProperty({ description: 'Doanh thu theo khoảng thời gian (ngày hoặc tháng)', type: [DailyRevenueDto] })
  revenueData: DailyRevenueDto[] | MonthlyRevenueDto[];

  @ApiProperty({ description: 'Loại khoảng thời gian', enum: TimeFilterType, example: TimeFilterType.DAILY })
  timeFilterType: TimeFilterType;

  @ApiProperty({ description: 'Đánh giá trung bình', example: 4.9 })
  averageRating: number;

  @ApiProperty({ description: 'Tổng số đánh giá', example: 20 })
  totalRatings: number;
}

export class MenuItemStatsDto {
  @ApiProperty({ description: 'ID món ăn', example: 1 })
  dishId: number;

  @ApiProperty({ description: 'Tên món ăn', example: 'Pizza Hải Sản' })
  name: string;

  @ApiProperty({ description: 'Hình ảnh món ăn', example: 'https://example.com/pizza.jpg' })
  image: string;

  @ApiProperty({ description: 'Số lượng đã bán hôm nay', example: 12 })
  todaySold: number;

  @ApiProperty({ description: 'Doanh thu từ món ăn hôm nay', example: 600 })
  todayRevenue: number;
} 