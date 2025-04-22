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
} from '@nestjs/swagger';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly userService: UserService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy giỏ hàng của người dùng hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin giỏ hàng thành công',
    type: CartResponseDto,
  })
  async getCart(@Req() req): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user.id);
    return this.cartService.getCart(currentUser.id);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm món ăn vào giỏ hàng' })
  @ApiBody({ type: AddToCartDto })
  @ApiResponse({
    status: 201,
    description: 'Thêm món ăn vào giỏ hàng thành công',
    type: CartResponseDto,
  })
  async addToCart(
    @Req() req,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user.id);
    return this.cartService.addToCart(currentUser.id, addToCartDto);
  }

  @Patch('item/:dishId')
  @ApiOperation({ summary: 'Cập nhật số lượng món ăn trong giỏ hàng' })
  @ApiParam({ name: 'dishId', description: 'ID của món ăn cần cập nhật' })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật món ăn trong giỏ hàng thành công',
    type: CartResponseDto,
  })
  async updateCartItem(
    @Req() req,
    @Param('dishId', ParseIntPipe) dishId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user['id']);
    return this.cartService.updateCartItem(
      currentUser.id,
      dishId,
      updateCartItemDto,
    );
  }

  @Delete('item/:dishId')
  @ApiOperation({ summary: 'Xóa món ăn khỏi giỏ hàng' })
  @ApiParam({ name: 'dishId', description: 'ID của món ăn cần xóa' })
  @ApiResponse({
    status: 200,
    description: 'Xóa món ăn khỏi giỏ hàng thành công',
    type: CartResponseDto,
  })
  async removeCartItem(
    @Req() req,
    @Param('dishId', ParseIntPipe) dishId: number,
  ): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user['id']);
    return this.cartService.removeItem(currentUser.id, dishId);
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