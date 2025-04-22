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
    const cartKey = this._getCartKey(userId);
    let cart = await this.cacheManager.get<CartResponseDto>(cartKey);

    if (!cart) {
      cart = this._createNewCart();
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
    const cart = await this.getCart(userId);

    for (const item of addToCartDto.items) {
      const dish = await this.dishService.getDishById(item.dishId);
      if (!dish) {
        throw new NotFoundException(`Dish with ID ${item.dishId} not found`);
      }

      this._addItemToCart(cart, item, dish.price);
    }

    await this._saveCart(userId, cart);
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
    const cart = await this.getCart(userId);

    const itemIndex = this._findCartItemIndex(cart, dishId);
    if (itemIndex === -1) {
      throw new NotFoundException(
        `Item with dish ID ${dishId} not found in cart`,
      );
    }

    cart.items[itemIndex].quantity = updateCartItemDto.quantity;

    await this._saveCart(userId, cart);
    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: number, dishId: number): Promise<CartResponseDto> {
    const cart = await this.getCart(userId);

    const itemIndex = this._findCartItemIndex(cart, dishId);
    if (itemIndex === -1) {
      throw new NotFoundException(
        `Item with dish ID ${dishId} not found in cart`,
      );
    }

    cart.items.splice(itemIndex, 1);

    await this._saveCart(userId, cart);
    return cart;
  }

  /**
   * Clear cart
   */
  async clearCart(userId: number): Promise<CartResponseDto> {
    const cart = this._createNewCart();
    await this._saveCart(userId, cart);
    return cart;
  }

  /**
   * Helper: Generate cart key
   */
  private _getCartKey(userId: number): string {
    return `cart:${userId}`;
  }

  /**
   * Helper: Create a new cart
   */
  private _createNewCart(): CartResponseDto {
    return {
      cartId: uuidv4(),
      items: [],
      totalPrice: 0,
      totalItems: 0,
    };
  }

  /**
   * Helper: Add item to cart
   */
  private _addItemToCart(cart: CartResponseDto, item: CartItemDto, price: number): void {
    const existingItemIndex = this._findCartItemIndex(cart, item.dishId);

    if (existingItemIndex !== -1) {
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      cart.items.push({ ...item, price });
    }

    this._recalculateTotals(cart);
  }

  /**
   * Helper: Find cart item index
   */
  private _findCartItemIndex(cart: CartResponseDto, dishId: number): number {
    return cart.items.findIndex((item) => item.dishId === dishId);
  }

  /**
   * Helper: Save cart to cache
   */
  private async _saveCart(userId: number, cart: CartResponseDto): Promise<void> {
    const cartKey = this._getCartKey(userId);
    this._recalculateTotals(cart);
    await this.cacheManager.set(cartKey, cart, this.CART_EXPIRY_TIME);
  }

  /**
   * Helper: Recalculate cart totals
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
