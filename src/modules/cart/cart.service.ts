import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';
import {
  CartItemDto,
  CartResponseDto,
  UpdateCartItemDto,
} from './dto/cart.dto';
import { DishService } from '../dish/dish.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from '../dish/entities/dish.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CartService {
  private readonly CART_EXPIRY_TIME = 60 * 60 * 24 * 7; // 7 days in seconds
  private readonly logger = new Logger(CartService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    private readonly dishService: DishService,
  ) {
    // Kiểm tra Redis khi khởi tạo service
    this.testRedisConnection();
  }

  /**
   * Test Redis connection
   */
  private async testRedisConnection() {
    try {
      // Lưu một giá trị test
      const testKey = 'test_redis_connection';
      const testValue = `test_${Date.now()}`;

      this.logger.log(
        `Testing Redis connection, setting ${testKey}=${testValue}`,
      );
      await this.cacheManager.set(testKey, testValue, 60);

      // Lấy giá trị để kiểm tra
      const retrievedValue = await this.cacheManager.get(testKey);

      if (retrievedValue === testValue) {
        this.logger.log('Redis connection successful! ✅');
      } else {
        this.logger.error(
          `Redis test failed: Expected ${testValue}, got ${retrievedValue}`,
        );
      }
    } catch (error) {
      this.logger.error('Redis connection test failed with error:', error);
    }
  }

  /**
   * Get cart by user ID or create a new one
   */
  async getCart(userId: number): Promise<CartResponseDto> {
    // Sử dụng userId làm key vì prefix 'cart:' đã được cấu hình trong CacheModule toàn cục
    const cartKey = `${userId}`;
    this.logger.log(`Getting cart with key: ${cartKey}`);

    let cart = await this.cacheManager.get<CartResponseDto>(cartKey);
    this.logger.log(`Cart found in Redis: ${cart ? 'Yes' : 'No'}`);

    if (!cart) {
      // Create a new cart if it doesn't exist
      cart = {
        cartId: uuidv4(),
        items: [],
        totalPrice: 0,
        totalItems: 0,
      };
      this.logger.log(`Creating new cart with ID: ${cart.cartId}`);

      try {
        await this.cacheManager.set(cartKey, cart, this.CART_EXPIRY_TIME);
        this.logger.log(`New cart saved to Redis with key: ${cartKey}`);

        // Verify the cart was set correctly
        const verifyCart =
          await this.cacheManager.get<CartResponseDto>(cartKey);
        this.logger.log(
          `Verification - Cart saved successfully: ${verifyCart ? 'Yes' : 'No'}`,
        );
      } catch (error) {
        this.logger.error(`Error saving cart to Redis: ${error.message}`);
      }
    }

    return cart;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    userId: number,
    dishId: number,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cartKey = `${userId}`;
    const cart = await this.getCart(userId);

    const itemIndex = cart.items.findIndex((item) => item.dishId === dishId);

    if (itemIndex === -1) {
      throw new NotFoundException(
        `Item with dish ID ${dishId} not found in cart`,
      );
    }

    // Update quantity from DTO
    cart.items[itemIndex].quantity = updateCartItemDto.quantity;

    // Recalculate totals
    this._recalculateTotals(cart);

    // Save updated cart
    await this.cacheManager.set(cartKey, cart, this.CART_EXPIRY_TIME);

    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: number, itemId: number): Promise<CartResponseDto> {
    const cartKey = `${userId}`;
    const cart = await this.getCart(userId);

    const itemIndex = cart.items.findIndex((item) => item.dishId === itemId);

    if (itemIndex === -1) {
      throw new NotFoundException(
        `Item with dish ID ${itemId} not found in cart`,
      );
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Recalculate totals
    this._recalculateTotals(cart);

    // Save updated cart
    await this.cacheManager.set(cartKey, cart, this.CART_EXPIRY_TIME);

    return cart;
  }

  /**
   * Clear cart
   */
  async clearCart(userId: number): Promise<CartResponseDto> {
    const cartKey = `${userId}`;
    await this.cacheManager.del(cartKey);

    // Trả về một giỏ hàng trống
    return {
      cartId: uuidv4(),
      items: [],
      totalPrice: 0,
      totalItems: 0,
    };
  }

  /**
   * Add a dish to cart by dishId and quantity
   */
  async addDishToCart(
    userId: number,
    dishId: number,
    quantity: number = 1,
  ): Promise<CartResponseDto> {
    const cartKey = `${userId}`;
    const cart = await this.getCart(userId);

    // Fetch dish details to get current price
    const dish = await this.dishService.getDishById(dishId);
    if (!dish) {
      throw new NotFoundException(`Dish with ID ${dishId} not found`);
    }

    // Create cart item with detailed information
    const cartItem: CartItemDto = {
      dishId: dishId,
      quantity: quantity,
      price: dish.price,
      name: dish.name,
      description: dish.description,
      thumbnail: dish.thumbnail,
      category: dish.category,
    };

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.dishId === dishId,
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item exists but preserve the existing item details
      cart.items[existingItemIndex].quantity += quantity;
      // Update other details in case they changed
      cart.items[existingItemIndex].price = dish.price;
      cart.items[existingItemIndex].name = dish.name;
      cart.items[existingItemIndex].description = dish.description;
      cart.items[existingItemIndex].thumbnail = dish.thumbnail;
      cart.items[existingItemIndex].category = dish.category;
    } else {
      // Add new item
      cart.items.push(cartItem);
    }

    // Recalculate totals
    this._recalculateTotals(cart);

    // Save updated cart
    await this.cacheManager.set(cartKey, cart, this.CART_EXPIRY_TIME);

    return cart;
  }

  /**
   * Recalculate cart totals
   */
  private _recalculateTotals(cart: CartResponseDto): void {
    cart.totalItems = cart.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  }
}
