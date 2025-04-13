import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';
import {
  AddToCartDto,
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

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    private readonly dishService: DishService,
  ) {}

  /**
   * Get cart by user ID or create a new one
   */
  async getCart(userId: number): Promise<CartResponseDto> {
    const cartKey = `cart:${userId}`;
    let cart = await this.cacheManager.get<CartResponseDto>(cartKey);

    if (!cart) {
      // Create a new cart if it doesn't exist
      cart = {
        cartId: uuidv4(),
        items: [],
        totalPrice: 0,
        totalItems: 0,
      };
      await this.cacheManager.set(cartKey, cart, this.CART_EXPIRY_TIME);
    }

    return cart;
  }

  /**
   * Add items to cart
   */
  async addToCart(
    userId: number,
    addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    const cartKey = `cart:${userId}`;
    const cart = await this.getCart(userId);

    // Fetch dish details for each item to get current price
    for (const item of addToCartDto.items) {
      const dish = await this.dishService.getDishById(item.dishId);
      if (!dish) {
        throw new NotFoundException(`Dish with ID ${item.dishId} not found`);
      }

      // Store current price with the item
      item.price = dish.price;

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (cartItem) => cartItem.dishId === item.dishId,
      );

      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        cart.items[existingItemIndex].quantity += item.quantity;
      } else {
        // Add new item
        cart.items.push(item);
      }
    }

    // Recalculate totals
    this._recalculateTotals(cart);

    // Save updated cart
    await this.cacheManager.set(cartKey, cart, this.CART_EXPIRY_TIME);

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
    const cartKey = `cart:${userId}`;
    const cart = await this.getCart(userId);

    const itemIndex = cart.items.findIndex((item) => item.dishId === dishId);

    if (itemIndex === -1) {
      throw new NotFoundException(
        `Item with dish ID ${dishId} not found in cart`,
      );
    }

    // Update quantity
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
  async removeItem(userId: number, dishId: number): Promise<CartResponseDto> {
    const cartKey = `cart:${userId}`;
    const cart = await this.getCart(userId);

    const itemIndex = cart.items.findIndex((item) => item.dishId === dishId);

    if (itemIndex === -1) {
      throw new NotFoundException(
        `Item with dish ID ${dishId} not found in cart`,
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
    const cartKey = `cart:${userId}`;
    const cart = await this.getCart(userId);

    cart.items = [];

    // Recalculate totals (will be zero)
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
