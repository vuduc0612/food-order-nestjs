import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  AddToCartDto,
  CartItemDto,
  CartResponseDto,
  UpdateCartItemDto,
} from './dto/cart.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { UserService } from '../user/user.service';
import {
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly userService: UserService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy thông tin giỏ hàng của user' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin giỏ hàng',
    type: CartResponseDto,
  })
  async getCart(@Req() req): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user['id']);
    return this.cartService.getCart(currentUser.id);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin giỏ hàng sau khi thêm sản phẩm',
    type: CartResponseDto,
  })
  async addToCart(
    @Req() req,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user['id']);
    return this.cartService.addToCart(currentUser.id, addToCartDto);
  }

  @Patch(':dishId')
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin giỏ hàng sau khi cập nhật',
    type: CartResponseDto,
  })
  async updateCartItem(
    @Req() req,
    @Param('dishId') dishId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user['id']);
    return this.cartService.updateCartItem(
      currentUser.id,
      +dishId,
      updateCartItemDto,
    );
  }

  @Delete(':dishId')
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin giỏ hàng sau khi xóa sản phẩm',
    type: CartResponseDto,
  })
  async removeFromCart(
    @Req() req,
    @Param('dishId') dishId: number,
  ): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user['id']);
    return this.cartService.removeItem(currentUser.id, +dishId);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Xóa toàn bộ giỏ hàng thành công',
    type: CartResponseDto,
  })
  async clearCart(@Req() req): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user['id']);
    return this.cartService.clearCart(currentUser.id);
  }
}
