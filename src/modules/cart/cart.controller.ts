import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CartService, Cart } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { CartDto } from './dto/cart.dto';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy thông tin giỏ hàng của user' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin giỏ hàng',
    type: CartDto,
  })
  async getCart(@Request() req): Promise<Cart> {
    const userId = req.user.id;
    return this.cartService.getCart(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin giỏ hàng sau khi thêm sản phẩm',
    type: CartDto,
  })
  async addToCart(
    @Request() req,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<Cart> {
    const userId = req.user.id;
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Put(':dishId')
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin giỏ hàng sau khi cập nhật',
    type: CartDto,
  })
  async updateCartItem(
    @Request() req,
    @Param('dishId') dishId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const userId = req.user.id;
    return this.cartService.updateCartItem(
      userId,
      +dishId,
      updateCartItemDto.quantity,
    );
  }

  @Delete(':dishId')
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin giỏ hàng sau khi xóa sản phẩm',
    type: CartDto,
  })
  async removeFromCart(
    @Request() req,
    @Param('dishId') dishId: number,
  ): Promise<Cart> {
    const userId = req.user.id;
    return this.cartService.removeFromCart(userId, +dishId);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Giỏ hàng đã được xóa',
  })
  async clearCart(@Request() req): Promise<void> {
    const userId = req.user.id;
    return this.cartService.clearCart(userId);
  }
} 