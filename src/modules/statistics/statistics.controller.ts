import { Controller, Get, Query, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { StatisticsQueryDto, StatisticsResponseDto } from './dto/statistics.dto';
import { DashboardStatsDto, TimeFilterType } from './dto/dashboard.dto';
import { StatisticsPeriod } from './enums/period.enum';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { RoleType } from '../account_role/enums/role-type.enum';

@ApiTags('Statistics')
@Controller('statistics')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Lấy thông tin dashboard tổng quan cho nhà hàng' })
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    description: 'Loại khoảng thời gian (daily: 7 ngày của tuần hiện tại, monthly: các ngày của tháng hiện tại, yearly: các tháng của năm hiện tại)',
    enum: TimeFilterType,
    example: TimeFilterType.DAILY
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin dashboard tổng quan',
    type: DashboardStatsDto
  })
  @Roles(RoleType.RESTAURANT)
  async getRestaurantDashboard(
    @Req() req,
    @Query('timeFilter') timeFilter: TimeFilterType = TimeFilterType.DAILY
  ): Promise<DashboardStatsDto> {
    // Lấy restaurantId từ user đang đăng nhập
    const restaurantId = req.user.id;
    return this.statisticsService.getRestaurantDashboard(restaurantId, timeFilter);
  }

  @Get('my-restaurant')
  @ApiOperation({ summary: 'Lấy thống kê doanh thu của nhà hàng hiện tại' })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    description: 'Khoảng thời gian thống kê', 
    enum: StatisticsPeriod,
    type: String
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    description: 'Ngày bắt đầu thống kê (ISO format)', 
    type: String
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    description: 'Ngày kết thúc thống kê (ISO format)', 
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê doanh thu nhà hàng hiện tại',
    type: StatisticsResponseDto
  })
  @Roles(RoleType.RESTAURANT)
  async getMyRestaurantStatistics(
    @Req() req,
    @Query() query: StatisticsQueryDto
  ): Promise<StatisticsResponseDto> {
    // Tìm nhà hàng dựa trên account ID
    const restaurantId = req.user.id; 
    return this.statisticsService.getRestaurantStatistics(restaurantId, query);
  }

  @Get('total-revenue')
  @ApiOperation({ summary: 'Lấy tổng doanh thu của tất cả đơn hàng đã hoàn thành' })
  @ApiResponse({
    status: 200,
    description: 'Tổng doanh thu',
    schema: {
      type: 'object',
      properties: {
        totalRevenue: {
          type: 'number',
          example: 125000,
          description: 'Tổng doanh thu từ đơn hàng đã hoàn thành'
        }
      }
    }
  })
  @Roles(RoleType.ADMIN)
  async getTotalCompletedOrdersRevenue(): Promise<{ totalRevenue: number }> {
    const totalRevenue = await this.statisticsService.getTotalCompletedOrdersRevenue();
    return { totalRevenue };
  }

  @Get('my-restaurant/total-revenue')
  @ApiOperation({ summary: 'Lấy tổng doanh thu của tất cả đơn hàng đã hoàn thành của nhà hàng hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Tổng doanh thu của nhà hàng hiện tại',
    schema: {
      type: 'object',
      properties: {
        totalRevenue: {
          type: 'number',
          example: 125000,
          description: 'Tổng doanh thu từ đơn hàng đã hoàn thành'
        }
      }
    }
  })
  @Roles(RoleType.RESTAURANT)
  async getMyRestaurantCompletedOrdersRevenue(
    @Req() req
  ): Promise<{ totalRevenue: number }> {
    const restaurantId = req.user.id;
    console.log(restaurantId);
    const totalRevenue = await this.statisticsService.getRestaurantCompletedOrdersRevenue(restaurantId);
    return { totalRevenue };
  }
} 