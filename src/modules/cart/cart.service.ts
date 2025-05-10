import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface CartItem {
  dishId: number;
  quantity: number;
  name: string;
  price: number;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  totalPrice: number;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    // Log để kiểm tra cache manager đã được inject đúng chưa
    this.logger.log('CartService initialized with cache manager');
  }

  // Tạo key cho cart dựa trên userId
  private getCartKey(userId: number): string {
    return `user_cart:${userId}`;
  }

  // Lấy giỏ hàng của user
  async getCart(userId: number): Promise<Cart> {
    const cartKey = this.getCartKey(userId);
    try {
      this.logger.log(`Attempting to get cart with key: ${cartKey}`);
      const cart = await this.cacheManager.get<Cart>(cartKey);
      
      if (!cart) {
        this.logger.log(`No cart found for key ${cartKey}, creating new cart`);
        // Nếu cart không tồn tại, tạo cart mới
        const newCart: Cart = { items: [], totalPrice: 0 };
        
        // Lưu với TTL dài hạn (1 tuần = 604800 giây)
        await this.cacheManager.set(cartKey, newCart, 604800);
        this.logger.log(`Created new cart for key ${cartKey}`);
        return newCart;
      }
      
      this.logger.log(`Retrieved cart for key ${cartKey}: ${JSON.stringify(cart)}`);
      return cart;
    } catch (error) {
      this.logger.error(`Error retrieving cart for key ${cartKey}: ${error.message}`, error.stack);
      // Fallback to empty cart
      return { items: [], totalPrice: 0 };
    }
  }

  // Thêm sản phẩm vào giỏ hàng
  async addToCart(userId: number, item: CartItem): Promise<Cart> {
    try {
      const cartKey = this.getCartKey(userId);
      this.logger.log(`Adding item to cart for key ${cartKey}: ${JSON.stringify(item)}`);
      
      const cart = await this.getCart(userId);
      
      // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
      const existingItemIndex = cart.items.findIndex(
        cartItem => cartItem.dishId === item.dishId
      );
      
      if (existingItemIndex !== -1) {
        // Nếu sản phẩm đã tồn tại, cập nhật số lượng
        cart.items[existingItemIndex].quantity += item.quantity;
        this.logger.log(`Updated quantity for existing item in cart: ${item.dishId}`);
      } else {
        // Nếu sản phẩm chưa tồn tại, thêm mới
        cart.items.push(item);
        this.logger.log(`Added new item to cart: ${item.dishId}`);
      }
      
      // Tính lại tổng giá
      cart.totalPrice = this.calculateTotalPrice(cart.items);
      
      // Lưu cart vào Redis với TTL dài hạn
      await this.cacheManager.set(cartKey, cart, 604800);
      this.logger.log(`Saved cart for key ${cartKey}`);
      
      return cart;
    } catch (error) {
      this.logger.error(`Error adding to cart for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  async updateCartItem(userId: number, dishId: number, quantity: number): Promise<Cart> {
    try {
      const cartKey = this.getCartKey(userId);
      this.logger.log(`Updating cart item for key ${cartKey}, dishId: ${dishId}, quantity: ${quantity}`);
      
      const cart = await this.getCart(userId);
      
      const itemIndex = cart.items.findIndex(item => item.dishId === dishId);
      
      if (itemIndex === -1) {
        throw new Error('Sản phẩm không tồn tại trong giỏ hàng');
      }
      
      if (quantity <= 0) {
        // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ hàng
        cart.items.splice(itemIndex, 1);
        this.logger.log(`Removed item from cart because quantity is <= 0: ${dishId}`);
      } else {
        // Cập nhật số lượng
        cart.items[itemIndex].quantity = quantity;
        this.logger.log(`Updated item quantity in cart: ${dishId} -> ${quantity}`);
      }
      
      // Tính lại tổng giá
      cart.totalPrice = this.calculateTotalPrice(cart.items);
      
      // Lưu cart vào Redis
      await this.cacheManager.set(cartKey, cart, 604800);
      this.logger.log(`Saved updated cart for key ${cartKey}`);
      
      return cart;
    } catch (error) {
      this.logger.error(`Error updating cart item for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Xóa sản phẩm khỏi giỏ hàng
  async removeFromCart(userId: number, dishId: number): Promise<Cart> {
    try {
      const cartKey = this.getCartKey(userId);
      this.logger.log(`Removing item from cart for key ${cartKey}, dishId: ${dishId}`);
      
      const cart = await this.getCart(userId);
      
      const itemIndex = cart.items.findIndex(item => item.dishId === dishId);
      
      if (itemIndex !== -1) {
        cart.items.splice(itemIndex, 1);
        this.logger.log(`Removed item from cart: ${dishId}`);
        
        // Tính lại tổng giá
        cart.totalPrice = this.calculateTotalPrice(cart.items);
        
        // Lưu cart vào Redis
        await this.cacheManager.set(cartKey, cart, 604800);
        this.logger.log(`Saved cart after removing item for key ${cartKey}`);
      } else {
        this.logger.log(`Item ${dishId} not found in cart, nothing to remove`);
      }
      
      return cart;
    } catch (error) {
      this.logger.error(`Error removing from cart for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Xóa toàn bộ giỏ hàng
  async clearCart(userId: number): Promise<void> {
    try {
      const cartKey = this.getCartKey(userId);
      this.logger.log(`Clearing cart for key ${cartKey}`);
      
      // Tạo giỏ hàng trống và lưu vào Redis
      await this.cacheManager.set(cartKey, { items: [], totalPrice: 0 }, 604800);
      this.logger.log(`Cart cleared for key ${cartKey}`);
    } catch (error) {
      this.logger.error(`Error clearing cart for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Hàm tính tổng giá trị giỏ hàng
  private calculateTotalPrice(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }
} 