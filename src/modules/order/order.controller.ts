import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  UseGuards, 
  Query, 
  ParseIntPipe, 
  Req,
  BadRequestException
} from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery, 
  ApiParam, 
  ApiBody 
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { RoleType } from '../account_role/enums/role-type.enum';
import { OrderStatus } from './enums/order-status.enum';
import { UserService } from '../user/user.service';
import { CreateOrderNoteDto, UpdateOrderStatusDto, OrdersPageResponseDto, OrderResponseDto } from './order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../restaurant/entities/restaurant.entity';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly userService: UserService,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>
  ) {}

  @Post('')
  @ApiOperation({ summary: 'Đặt hàng từ giỏ hàng hiện tại' })
  @ApiBody({ 
    type: CreateOrderNoteDto, 
    required: false,
    description: 'Thông tin ghi chú đơn hàng'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Đơn hàng đã được tạo thành công',
    type: Order 
  })
  @Roles(RoleType.CUSTOMER)
  async createOrderFromCart(
    @Req() req,
    @Body() createOrderNoteDto?: CreateOrderNoteDto
  ): Promise<Order> {
    const currentUser = await this.userService.getCurrentUser(req.user.id);
    return this.orderService.createOrderFromCart(currentUser.id, createOrderNoteDto?.note);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng (restaurant)' })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Số trang (bắt đầu từ 0)' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Số lượng kết quả mỗi trang' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách đơn hàng',
    type: OrdersPageResponseDto 
  })
  @Roles(RoleType.RESTAURANT)
  async getAllOrders(
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10
  ) {
    console.log(`Controller: getAllOrders called with page=${page}, limit=${limit}`);
    
    const [orders, total] = await this.orderService.getAllOrders(page, limit);
    console.log(`Received ${orders.length} orders from service, total: ${total}`);
    
    // Chuyển đổi orders sang dạng DTO
    const enhancedOrders = orders.map(order => this.mapOrderToResponse(order));
    
    const response = { 
      content: enhancedOrders, 
      total,
      page,
      size: limit,
      totalPages: Math.ceil(total / limit)
    };
    
    console.log(`Returning response with ${enhancedOrders.length} orders, totalPages: ${Math.ceil(total / limit)}`);
    
    return response;
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng của người dùng hiện tại' })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Số trang (bắt đầu từ 0)' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Số lượng kết quả mỗi trang' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách đơn hàng của người dùng',
    type: OrdersPageResponseDto 
  })
  @Roles(RoleType.CUSTOMER)
  async getMyOrders(
    @Req() req,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10
  ) {
    console.log(`Controller: getMyOrders called with page=${page}, limit=${limit}`);
    
    const currentUser = await this.userService.getCurrentUser(req.user.id);
    console.log(`Current user ID: ${currentUser.id}`);
    
    const [orders, total] = await this.orderService.getUserOrders(currentUser.id, page, limit);
    console.log(`Received ${orders.length} orders from service, total: ${total}`);
    
    // Chuyển đổi orders sang dạng DTO
    const enhancedOrders = orders.map(order => this.mapOrderToResponse(order));
    
    const response = { 
      content: enhancedOrders, 
      total,
      page,
      size: limit,
      totalPages: Math.ceil(total / limit)
    };
    
    console.log(`Returning response with ${enhancedOrders.length} orders, totalPages: ${Math.ceil(total / limit)}`);
    
    return response;
  }

  @Get('restaurant-orders')
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng của nhà hàng' })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Số trang (bắt đầu từ 0)' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Số lượng kết quả mỗi trang' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách đơn hàng của nhà hàng',
    type: OrdersPageResponseDto 
  })
  @Roles(RoleType.RESTAURANT)
  async getRestaurantOrders(
    @Req() req,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10
  ) {
    console.log(`Controller: getRestaurantOrders called with page=${page}, limit=${limit}`);
    
    // Lấy nhà hàng của user hiện tại
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: req.user.id }
    });
    
    if (!restaurant) {
      throw new BadRequestException('User is not associated with any restaurant');
    }
    
    console.log(`Found restaurant ID: ${restaurant.id} for account ID: ${req.user.id}`);
    
    const [orders, total] = await this.orderService.getRestaurantOrders(restaurant.id, page, limit);
    console.log(`Received ${orders.length} orders from service, total: ${total}`);
    
    // Chuyển đổi orders sang dạng DTO
    const enhancedOrders = orders.map(order => this.mapOrderToResponse(order));
    
    const response = { 
      content: enhancedOrders, 
      total,
      page,
      size: limit,
      totalPages: Math.ceil(total / limit)
    };
    
    console.log(`Returning response with ${enhancedOrders.length} orders, totalPages: ${Math.ceil(total / limit)}`);
    
    return response;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết đơn hàng' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thông tin chi tiết đơn hàng',
    type: OrderResponseDto 
  })
  @Roles(RoleType.CUSTOMER, RoleType.RESTAURANT)
  async getOrderById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req
  ) {
    console.log(`Getting order details for ID: ${id}`);
    const order = await this.orderService.getOrderById(id);
    return this.mapOrderToResponse(order);
    
    throw new BadRequestException('You do not have permission to view this order');
  }
  
  /**
   * Chuyển đổi đối tượng Order thành OrderResponseDto
   */
  private mapOrderToResponse(order: Order): OrderResponseDto {
    const { restaurant, orderDetails, ...orderData } = order;
    
    return {
      ...orderData,
      restaurant: restaurant ? {
        id: restaurant.id,
        name: restaurant.name,
        image_url: restaurant.image_url,
        address: restaurant.address,
        phone: restaurant.phone
      } : null,
      items: orderDetails ? orderDetails.map(detail => ({
        id: detail.id,
        dish_id: detail.dish_id,
        dish_name: detail.dish?.name || 'Unknown',
        dish_thumbnail: detail.dish?.thumbnail || null,
        quantity: detail.quantity,
        price: detail.price,
        subtotal: detail.quantity * Number(detail.price)
      })) : [],
      created_at: order.created_at,
      updated_at: order.updated_at,
      totalItems: orderDetails ? orderDetails.reduce(
        (sum, detail) => sum + detail.quantity, 0
      ) : 0
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Trạng thái đơn hàng đã được cập nhật',
    type: Order 
  })
  @Roles(RoleType.ADMIN, RoleType.RESTAURANT)
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Req() req
  ): Promise<Order> {
    const { status } = updateOrderStatusDto;
    
    // Kiểm tra quyền cập nhật
    const order = await this.orderService.getOrderById(id);
    const userRoles = req.user.roles || [];
    
    // Admin có thể cập nhật tất cả đơn hàng
    if (userRoles.includes(RoleType.ADMIN)) {
      return this.orderService.updateOrderStatus(id, status);
    }
    
    // Nhà hàng chỉ cập nhật được đơn hàng của nhà hàng mình
    if (userRoles.includes(RoleType.RESTAURANT)) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { accountId: req.user.id }
      });
      
      if (restaurant && order.restaurant_id === restaurant.id) {
        return this.orderService.updateOrderStatus(id, status);
      }
    }
    
    throw new BadRequestException('You do not have permission to update this order');
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng' })
  @ApiParam({ name: 'id', description: 'ID của đơn hàng' })
  @ApiResponse({ 
    status: 200, 
    description: 'Đơn hàng đã được hủy',
    type: Order 
  })
  @Roles(RoleType.CUSTOMER)
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Req() req
  ): Promise<Order> {
    const currentUser = await this.userService.getCurrentUser(req.user.id);
    return this.orderService.cancelOrder(id, currentUser.id);
  }
}
