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

  async getCart(userId: number): Promise<CartResponseDto> {
    const cartKey = this._getCartKey(userId);
    const cart = await this.cacheManager.get<CartResponseDto>(cartKey);
    
    if (!cart) {
      return this._createNewCart();
    }
    
    return cart;
  }

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

  async updateCartItem(
    userId: number,
    dishId: number,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.getCart(userId);
    const itemIndex = this._findCartItemIndex(cart, dishId);
    
    if (itemIndex === -1) {
      throw new NotFoundException(`Item with ID ${dishId} not found in cart`);
    }
    
    cart.items[itemIndex].quantity = updateCartItemDto.quantity;
    this._recalculateTotals(cart);
    
    await this._saveCart(userId, cart);
    return cart;
  }

  async removeItem(userId: number, dishId: number): Promise<CartResponseDto> {
    const cart = await this.getCart(userId);
    const itemIndex = this._findCartItemIndex(cart, dishId);
    
    if (itemIndex !== -1) {
      cart.items.splice(itemIndex, 1);
      this._recalculateTotals(cart);
      await this._saveCart(userId, cart);
    }
    
    return cart;
  }

  async clearCart(userId: number): Promise<CartResponseDto> {
    const newCart = this._createNewCart();
    await this._saveCart(userId, newCart);
    return newCart;
  }

  private _getCartKey(userId: number): string {
    return `cart:${userId}`;
  }

  private _createNewCart(): CartResponseDto {
    return {
      cartId: uuidv4(),
      items: [],
      totalPrice: 0,
      totalItems: 0,
    };
  }

  private _addItemToCart(cart: CartResponseDto, item: CartItemDto, price: number): void {
    const existingItemIndex = this._findCartItemIndex(cart, item.dishId);
    
    if (existingItemIndex !== -1) {
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      cart.items.push({
        ...item,
        price,
      });
    }
    
    this._recalculateTotals(cart);
  }

  private _findCartItemIndex(cart: CartResponseDto, dishId: number): number {
    return cart.items.findIndex(item => item.dishId === dishId);
  }

  private async _saveCart(userId: number, cart: CartResponseDto): Promise<void> {
    const cartKey = this._getCartKey(userId);
    await this.cacheManager.set(cartKey, cart, this.CART_EXPIRY_TIME);
  }

  private _recalculateTotals(cart: CartResponseDto): void {
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    cart.totalItems = cart.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );
  }
}
