import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { OrderDetail } from '../order_detail/entities/order_detail.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { Dish } from '../dish/entities/dish.entity';
import { 
  StatisticsQueryDto, 
  StatisticsResponseDto,
  RevenueStatisticsDto,
  DailyRevenueDto as StatDailyRevenueDto,
  MonthlyRevenueDto as StatMonthlyRevenueDto,
  YearlyRevenueDto,
  TopDishDto 
} from './dto/statistics.dto';
import { DashboardStatsDto, DailyRevenueDto, MenuItemStatsDto, TimeFilterType, MonthlyRevenueDto } from './dto/dashboard.dto';
import { StatisticsPeriod } from './enums/period.enum';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>
  ) {}

  /**
   * Lấy thông tin dashboard tổng quan cho nhà hàng
   */
  async getRestaurantDashboard(restaurantId: number, timeFilter: TimeFilterType): Promise<DashboardStatsDto> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
    }

    // Lấy ngày hiện tại
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // Lấy số lượng đơn hàng hoàn thành (trạng thái COMPLETED)
    const runningOrders = await this.orderRepository.count({
      where: {
        restaurant_id: restaurantId,
        status: 'completed'
      }
    });

    // Lấy số lượng đơn hàng đang chờ xử lý (tất cả đơn hàng không phải COMPLETED)
    const orderRequests = await this.orderRepository.count({
      where: {
        restaurant_id: restaurantId,
        status: In(['pending'])
      }
    });

    // Lấy tổng doanh thu hôm nay
    const todayOrders = await this.orderRepository.find({
      where: {
        restaurant_id: restaurantId,
        created_at: Between(startOfToday, endOfToday),
        status: 'completed'
      }
    });

    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + Number(order.total_price), 
      0
    );

    // Xác định khoảng thời gian dựa vào timeFilter
    let startDate: Date;
    let endDate = endOfToday;
    
    switch (timeFilter) {
      case TimeFilterType.DAILY:
        // Lấy 7 ngày của tuần hiện tại
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 6); // lấy 7 ngày (ngày hiện tại + 6 ngày trước)
        startDate = startOfDay(last7Days);
        break;
      case TimeFilterType.MONTHLY:
        // Lấy tất cả các ngày của tháng hiện tại
        startDate = startOfMonth(today);
        break;
      case TimeFilterType.YEARLY:
        // Lấy tất cả các tháng của năm hiện tại
        startDate = startOfYear(today);
        break;
      default:
        // Mặc định lấy 7 ngày gần nhất
        const defaultLast7Days = new Date(today);
        defaultLast7Days.setDate(today.getDate() - 6);
        startDate = startOfDay(defaultLast7Days);
        break;
    }
    
    // Lấy dữ liệu doanh thu theo khoảng thời gian
    let revenueData: DailyRevenueDto[] | MonthlyRevenueDto[] = [];
    
    if (timeFilter === TimeFilterType.YEARLY) {
      // Lấy doanh thu theo tháng cho cả năm
      const monthlyRevenueData = await this.getMonthlyRevenueForDashboard(restaurantId, startDate, endDate);
      revenueData = monthlyRevenueData;
    } else {
      // Lấy doanh thu theo ngày
      revenueData = await this.getDailyRevenueForDashboard(restaurantId, startDate, endDate);
    }

    // Giả lập dữ liệu đánh giá (vì chưa có module đánh giá)
    // Trong thực tế, bạn sẽ cần truy vấn từ bảng ratings
    const averageRating = 4.9;
    const totalRatings = 20;

    return {
      runningOrders,
      orderRequests,
      todayRevenue,
      revenueData,
      timeFilterType: timeFilter,
      averageRating,
      totalRatings
    };
  }

  /**
   * Lấy thống kê doanh thu cho nhà hàng
   */
  async getRestaurantStatistics(
    restaurantId: number,
    query: StatisticsQueryDto
  ): Promise<StatisticsResponseDto> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
    }

    // Xác định khoảng thời gian
    const { startDate, endDate } = this.getDateRange(query);

    // Lấy thống kê tổng quát
    const summary = await this.getRevenueSummary(restaurantId, startDate, endDate);

    // Lấy thống kê theo thời gian
    let dailyRevenue = null;
    let monthlyRevenue = null;
    let yearlyRevenue = null;

    switch (query.period) {
      case StatisticsPeriod.DAY:
      case StatisticsPeriod.WEEK:
        dailyRevenue = await this.getDailyRevenue(restaurantId, startDate, endDate);
        break;
      case StatisticsPeriod.MONTH:
        dailyRevenue = await this.getDailyRevenue(restaurantId, startDate, endDate);
        break;
      case StatisticsPeriod.YEAR:
        monthlyRevenue = await this.getMonthlyRevenue(restaurantId, startDate, endDate);
        break;
      case StatisticsPeriod.CUSTOM:
        // Xác định loại thống kê dựa vào khoảng thời gian
        const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        
        if (diffInDays <= 60) {
          dailyRevenue = await this.getDailyRevenue(restaurantId, startDate, endDate);
        } else if (diffInDays <= 365) {
          monthlyRevenue = await this.getMonthlyRevenue(restaurantId, startDate, endDate);
        } else {
          yearlyRevenue = await this.getYearlyRevenue(restaurantId, startDate, endDate);
        }
        break;
    }

    // Lấy top món ăn bán chạy
    const topDishes = await this.getTopDishes(restaurantId, startDate, endDate);

    return {
      summary,
      dailyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      topDishes
    };
  }

  /**
   * Xác định khoảng thời gian dựa vào query
   */
  private getDateRange(query: StatisticsQueryDto): { startDate: Date, endDate: Date } {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    // Nếu startDate và endDate được cung cấp, sử dụng chúng
    if (query.startDate && query.endDate) {
      startDate = startOfDay(parseISO(query.startDate));
      endDate = endOfDay(parseISO(query.endDate));
      return { startDate, endDate };
    }

    // Nếu không, xác định dựa vào period
    switch (query.period) {
      case StatisticsPeriod.DAY:
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case StatisticsPeriod.WEEK:
        startDate = startOfWeek(today);
        endDate = endOfWeek(today);
        break;
      case StatisticsPeriod.MONTH:
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case StatisticsPeriod.YEAR:
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Lấy thống kê tổng quát
   */
  private async getRevenueSummary(
    restaurantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueStatisticsDto> {
    const orders = await this.orderRepository.find({
      where: {
        restaurant_id: restaurantId,
        created_at: Between(startDate, endDate),
        status: 'completed'  // Chỉ tính các đơn hàng đã hoàn thành
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price), 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    return {
      totalRevenue,
      orderCount,
      averageOrderValue
    };
  }

  /**
   * Lấy thống kê doanh thu theo ngày
   */
  private async getDailyRevenue(
    restaurantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<StatDailyRevenueDto[]> {
    // Lấy tất cả đơn hàng trong khoảng thời gian
    const orders = await this.orderRepository.find({
      where: {
        restaurant_id: restaurantId,
        created_at: Between(startDate, endDate),
        status: 'completed'
      }
    });

    // Tạo map để tính toán doanh thu theo ngày
    const dailyMap = new Map<string, { revenue: number, count: number }>();

    // Xử lý từng đơn hàng
    orders.forEach(order => {
      const dateStr = format(order.created_at, 'yyyy-MM-dd');
      
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { revenue: 0, count: 0 });
      }
      
      const dailyData = dailyMap.get(dateStr);
      dailyData.revenue += Number(order.total_price);
      dailyData.count += 1;
    });

    // Chuyển map thành mảng kết quả
    const result: StatDailyRevenueDto[] = [];
    
    // Duyệt qua từng ngày trong khoảng thời gian
    for (const [dateStr, data] of dailyMap.entries()) {
      result.push({
        date: dateStr,
        revenue: data.revenue,
        orderCount: data.count
      });
    }

    // Sắp xếp theo ngày
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Lấy thống kê doanh thu theo tháng
   */
  private async getMonthlyRevenue(
    restaurantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<MonthlyRevenueDto[]> {
    const orders = await this.orderRepository.find({
      where: {
        restaurant_id: restaurantId,
        created_at: Between(startDate, endDate),
        status: 'completed'
      }
    });

    const monthlyMap = new Map<string, { revenue: number, count: number }>();

    orders.forEach(order => {
      const monthStr = format(order.created_at, 'yyyy-MM');
      
      if (!monthlyMap.has(monthStr)) {
        monthlyMap.set(monthStr, { revenue: 0, count: 0 });
      }
      
      const monthlyData = monthlyMap.get(monthStr);
      monthlyData.revenue += Number(order.total_price);
      monthlyData.count += 1;
    });

    const result: MonthlyRevenueDto[] = [];
    
    for (const [monthStr, data] of monthlyMap.entries()) {
      result.push({
        month: monthStr,
        revenue: data.revenue,
        orderCount: data.count
      });
    }

    return result.sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Lấy thống kê doanh thu theo năm
   */
  private async getYearlyRevenue(
    restaurantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<YearlyRevenueDto[]> {
    const orders = await this.orderRepository.find({
      where: {
        restaurant_id: restaurantId,
        created_at: Between(startDate, endDate),
        status: 'completed'
      }
    });

    const yearlyMap = new Map<string, { revenue: number, count: number }>();

    orders.forEach(order => {
      const yearStr = format(order.created_at, 'yyyy');
      
      if (!yearlyMap.has(yearStr)) {
        yearlyMap.set(yearStr, { revenue: 0, count: 0 });
      }
      
      const yearlyData = yearlyMap.get(yearStr);
      yearlyData.revenue += Number(order.total_price);
      yearlyData.count += 1;
    });

    const result: YearlyRevenueDto[] = [];
    
    for (const [yearStr, data] of yearlyMap.entries()) {
      result.push({
        year: yearStr,
        revenue: data.revenue,
        orderCount: data.count
      });
    }

    return result.sort((a, b) => a.year.localeCompare(b.year));
  }

  /**
   * Lấy top món ăn bán chạy
   */
  private async getTopDishes(
    restaurantId: number,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<TopDishDto[]> {
    // Lấy tất cả đơn hàng của nhà hàng trong khoảng thời gian
    const orders = await this.orderRepository.find({
      where: {
        restaurant_id: restaurantId,
        created_at: Between(startDate, endDate),
        status: 'completed'
      },
      relations: ['orderDetails', 'orderDetails.dish']
    });

    // Tạo map để tính toán số lượng và doanh thu theo món ăn
    const dishMap = new Map<number, { 
      dishId: number, 
      dishName: string, 
      quantity: number, 
      revenue: number,
      thumbnail?: string
    }>();

    // Xử lý từng đơn hàng và chi tiết đơn hàng
    orders.forEach(order => {
      if (order.orderDetails) {
        order.orderDetails.forEach(detail => {
          const dishId = detail.dish_id;
          
          if (!dishMap.has(dishId)) {
            dishMap.set(dishId, { 
              dishId, 
              dishName: detail.dish?.name || `Dish #${dishId}`, 
              quantity: 0, 
              revenue: 0,
              thumbnail: detail.dish?.thumbnail
            });
          }
          
          const dishData = dishMap.get(dishId);
          dishData.quantity += detail.quantity;
          dishData.revenue += Number(detail.price) * detail.quantity;
        });
      }
    });

    // Chuyển map thành mảng và sắp xếp theo doanh thu giảm dần
    const result = Array.from(dishMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return result;
  }

  /**
   * Lấy thống kê doanh thu theo ngày cho dashboard
   */
  private async getDailyRevenueForDashboard(
    restaurantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<DailyRevenueDto[]> {
    // Lấy tất cả đơn hàng trong khoảng thời gian
    const orders = await this.orderRepository.find({
      where: {
        restaurant_id: restaurantId,
        created_at: Between(startDate, endDate),
        status: 'completed'
      }
    });

    // Tạo map để tính toán doanh thu theo ngày
    const dailyMap = new Map<string, { revenue: number, count: number }>();

    // Xử lý từng đơn hàng
    orders.forEach(order => {
      const dateStr = format(order.created_at, 'yyyy-MM-dd');
      
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { revenue: 0, count: 0 });
      }
      
      const dailyData = dailyMap.get(dateStr);
      dailyData.revenue += Number(order.total_price);
      dailyData.count += 1;
    });

    // Chuyển map thành mảng kết quả
    const result: DailyRevenueDto[] = [];
    
    // Tạo dữ liệu cho tất cả các ngày trong khoảng, kể cả ngày không có doanh thu
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const data = dailyMap.get(dateStr) || { revenue: 0, count: 0 };
      
      result.push({
        date: dateStr,
        revenue: data.revenue,
        orderCount: data.count
      });
      
      // Tăng ngày lên 1
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sắp xếp theo ngày
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Lấy thống kê doanh thu theo tháng cho dashboard
   */
  private async getMonthlyRevenueForDashboard(
    restaurantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<MonthlyRevenueDto[]> {
    // Lấy tất cả đơn hàng trong khoảng thời gian
    const orders = await this.orderRepository.find({
      where: {
        restaurant_id: restaurantId,
        created_at: Between(startDate, endDate),
        status: 'completed'
      }
    });

    // Tạo map để tính toán doanh thu theo tháng
    const monthlyMap = new Map<string, { revenue: number, count: number }>();

    // Xử lý từng đơn hàng
    orders.forEach(order => {
      const monthStr = format(order.created_at, 'yyyy-MM');
      
      if (!monthlyMap.has(monthStr)) {
        monthlyMap.set(monthStr, { revenue: 0, count: 0 });
      }
      
      const monthlyData = monthlyMap.get(monthStr);
      monthlyData.revenue += Number(order.total_price);
      monthlyData.count += 1;
    });

    // Chuyển map thành mảng kết quả
    const result: MonthlyRevenueDto[] = [];
    
    // Tạo dữ liệu cho tất cả các tháng trong khoảng, kể cả tháng không có doanh thu
    let currentDate = new Date(startDate);
    currentDate.setDate(1); // Đặt về ngày đầu tiên của tháng
    
    while (currentDate <= endDate) {
      const monthStr = format(currentDate, 'yyyy-MM');
      const data = monthlyMap.get(monthStr) || { revenue: 0, count: 0 };
      
      result.push({
        month: monthStr,
        revenue: data.revenue,
        orderCount: data.count
      });
      
      // Tăng tháng lên 1
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Sắp xếp theo tháng
    return result.sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Tính tổng doanh thu từ tất cả đơn hàng đã hoàn thành
   */
  async getTotalCompletedOrdersRevenue(): Promise<number> {
    const completedOrders = await this.orderRepository.find({
      where: {
        status: 'completed'
      }
    });

    // Tính tổng doanh thu
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + Number(order.total_price), 
      0
    );

    return totalRevenue;
  }

  /**
   * Tính tổng doanh thu từ tất cả đơn hàng đã hoàn thành của một nhà hàng cụ thể
   */
  async getRestaurantCompletedOrdersRevenue(restaurantId: number): Promise<number> {
    console.log(restaurantId);
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
    }

    const completedOrders = await this.orderRepository.find({
      where: {
        restaurant_id: restaurantId,
        status: 'completed'
      }
    });
    console.log(completedOrders);
    // Tính tổng doanh thu
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + Number(order.total_price), 
      0
    );

    return totalRevenue;
  }
} 