import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from '../order_detail/entities/order_detail.entity';
import { CreateOrderDto } from './order.dto';
import { CartService } from '../cart/cart.service';
import { DishService } from '../dish/dish.service';
import { User } from '../user/entities/user.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { Dish } from '../dish/entities/dish.entity';
import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    private readonly cartService: CartService,
    private readonly dishService: DishService,
    private readonly dataSource: DataSource,
  ) {}

  async createOrderFromCart(userId: number, note?: string): Promise<Order> {
    // Lấy giỏ hàng của user
    const cart = await this.cartService.getCart(userId);
    
    // Kiểm tra giỏ hàng có rỗng không
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty. Cannot create order.');
    }

    // Kiểm tra user tồn tại
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Tạo transaction để đảm bảo tính toàn vẹn dữ liệu
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lấy thông tin nhà hàng của món ăn đầu tiên (chỉ để lấy restaurant_id)
      const firstDish = await this.dishRepository.findOne({
        where: { id: cart.items[0].dishId },
        relations: ['restaurant'],
      });
      
      if (!firstDish) {
        throw new NotFoundException(`Dish with ID ${cart.items[0].dishId} not found`);
      }
      
      const restaurantId = firstDish.restaurant.id;

      // Tạo đơn hàng mới
      const order = new Order();
      order.user_id = userId;
      order.restaurant_id = restaurantId;
      order.total_price = cart.totalPrice;
      order.status = OrderStatus.PENDING;
      order.note = note;
      
      // Lưu order
      const savedOrder = await queryRunner.manager.save(order);
      
      // Tạo các order detail từ items trong giỏ hàng
      for (const item of cart.items) {
        const orderDetail = new OrderDetail();
        orderDetail.order_id = savedOrder.id;
        orderDetail.dish_id = item.dishId;
        orderDetail.quantity = item.quantity;
        orderDetail.price = item.price;
        
        // Lưu order detail
        await queryRunner.manager.save(orderDetail);
      }
      
      // Commit transaction
      await queryRunner.commitTransaction();
      
      // Xóa giỏ hàng sau khi đặt hàng thành công
      await this.cartService.clearCart(userId);
      
      // Trả về order đã tạo với đầy đủ thông tin
      return this.getOrderById(savedOrder.id);
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Giải phóng queryRunner
      await queryRunner.release();
    }
  }

  async getAllOrders(page: number = 0, limit: number = 10): Promise<[Order[], number]> {
    return this.orderRepository.findAndCount({
      relations: ['user', 'restaurant', 'orderDetails', 'orderDetails.dish'],
      order: { created_at: 'DESC' },
      skip: page * limit,
      take: limit,
    });
  }

  async getUserOrders(userId: number, page: number = 0, limit: number = 10): Promise<[Order[], number]> {
    console.log(`Getting orders for user ${userId}, page: ${page}, limit: ${limit}`);
    
    // Nếu page bắt đầu từ 1, điều chỉnh về 0 để tương thích với cơ sở dữ liệu
    const adjustedPage = page > 0 ? page - 1 : 0;
    console.log(`Adjusted page: ${adjustedPage}`);
    
    try {
      // Sử dụng findAndCount để đảm bảo nạp đầy đủ các mối quan hệ
      const [orders, count] = await this.orderRepository.findAndCount({
        where: { user_id: userId },
        relations: {
          restaurant: true,
          orderDetails: {
            dish: true
          }
        },
        order: { created_at: 'DESC' },
        skip: adjustedPage * limit,
        take: limit,
      });
      
      console.log(`Found ${orders.length} orders out of ${count} total`);
      
      // Xử lý trường hợp không có order ở trang hiện tại
      if (orders.length === 0 && count > 0 && page > 0) {
        console.log('WARNING: No orders found for this page, but total count > 0');
        console.log('Trying with page 0 instead');
        return this.getUserOrders(userId, 0, limit);
      }

      // Tính toán tổng số món ăn trong mỗi đơn hàng
      for (const order of orders) {
        if (!order.orderDetails) {
          console.log(`Warning: Order ${order.id} has no orderDetails`);
          (order as any).totalItems = 0;
          continue;
        }
        
        const totalItems = order.orderDetails.reduce(
          (sum, detail) => sum + detail.quantity,
          0
        );
        (order as any).totalItems = totalItems;
        
        // Kiểm tra dish trong mỗi orderDetail
        for (const detail of order.orderDetails) {
          if (!detail.dish) {
            console.log(`Warning: OrderDetail ${detail.id} for Order ${order.id} has no dish information`);
          }
        }
      }
      
      return [orders, count];
    } catch (error) {
      console.error('Error fetching user orders:', error.message);
      throw error;
    }
  }

  async getRestaurantOrders(restaurantId: number, page: number = 0, limit: number = 10): Promise<[Order[], number]> {
    return this.orderRepository.findAndCount({
      where: { restaurant_id: restaurantId },
      relations: ['user', 'restaurant', 'orderDetails', 'orderDetails.dish'],
      order: { created_at: 'DESC' },
      skip: page * limit,
      take: limit,
    });
  }

  async getOrderById(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'restaurant', 'orderDetails', 'orderDetails.dish'],
    });
    
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    
    return order;
  }

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
    const order = await this.getOrderById(orderId);
    
    order.status = status;
    order.updated_at = new Date();
    
    return this.orderRepository.save(order);
  }

  async cancelOrder(orderId: number, userId: number): Promise<Order> {
    const order = await this.getOrderById(orderId);
    
    // Kiểm tra xem order có thuộc về user hiện tại không
    if (order.user_id !== userId) {
      throw new BadRequestException('You can only cancel your own orders');
    }
    
    // Kiểm tra trạng thái order
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be canceled');
    }
    
    order.status = OrderStatus.CANCELLED;
    order.updated_at = new Date();
    
    return this.orderRepository.save(order);
  }
}
