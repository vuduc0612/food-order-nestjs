import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { StatisticsPeriod } from '../enums/period.enum';

export class StatisticsQueryDto {
  @ApiProperty({
    description: 'Khoảng thời gian thống kê',
    enum: StatisticsPeriod,
    default: StatisticsPeriod.MONTH,
    required: false,
  })
  @IsEnum(StatisticsPeriod)
  @IsOptional()
  period?: StatisticsPeriod;

  @ApiProperty({
    description: 'Ngày bắt đầu thống kê (ISO format)',
    required: false,
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Ngày kết thúc thống kê (ISO format)',
    required: false,
    example: '2025-01-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class RevenueStatisticsDto {
  @ApiProperty({ description: 'Tổng doanh thu', example: 12500000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Số lượng đơn hàng', example: 125 })
  orderCount: number;

  @ApiProperty({ description: 'Giá trị đơn hàng trung bình', example: 100000 })
  averageOrderValue: number;
}

export class DailyRevenueDto {
  @ApiProperty({ description: 'Ngày', example: '2025-01-01' })
  date: string;

  @ApiProperty({ description: 'Doanh thu', example: 1250000 })
  revenue: number;

  @ApiProperty({ description: 'Số lượng đơn hàng', example: 12 })
  orderCount: number;
}

export class MonthlyRevenueDto {
  @ApiProperty({ description: 'Tháng', example: '2025-01' })
  month: string;

  @ApiProperty({ description: 'Doanh thu', example: 12500000 })
  revenue: number;

  @ApiProperty({ description: 'Số lượng đơn hàng', example: 125 })
  orderCount: number;
}

export class YearlyRevenueDto {
  @ApiProperty({ description: 'Năm', example: '2025' })
  year: string;

  @ApiProperty({ description: 'Doanh thu', example: 150000000 })
  revenue: number;

  @ApiProperty({ description: 'Số lượng đơn hàng', example: 1500 })
  orderCount: number;
}

export class TopDishDto {
  @ApiProperty({ description: 'ID món ăn', example: 1 })
  dishId: number;

  @ApiProperty({ description: 'Tên món ăn', example: 'Phở bò' })
  dishName: string;

  @ApiProperty({ description: 'Số lượng đã bán', example: 150 })
  quantity: number;

  @ApiProperty({ description: 'Doanh thu', example: 3000000 })
  revenue: number;

  @ApiProperty({ description: 'Ảnh thumbnail', example: 'https://example.com/pho.jpg' })
  thumbnail?: string;
}

export class StatisticsResponseDto {
  @ApiProperty({ type: RevenueStatisticsDto })
  summary: RevenueStatisticsDto;

  @ApiProperty({ type: [DailyRevenueDto], required: false })
  dailyRevenue?: DailyRevenueDto[];

  @ApiProperty({ type: [MonthlyRevenueDto], required: false })
  monthlyRevenue?: MonthlyRevenueDto[];

  @ApiProperty({ type: [YearlyRevenueDto], required: false })
  yearlyRevenue?: YearlyRevenueDto[];

  @ApiProperty({ type: [TopDishDto] })
  topDishes: TopDishDto[];
} 