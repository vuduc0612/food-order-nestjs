import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CartResponseDto, UpdateCartItemDto } from './dto/cart.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { UserService } from '../user/user.service';
import {
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { RoleType } from '../account_role/enums/role-type.enum';

@ApiTags('Cart')
@Controller('cart')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly userService: UserService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy giỏ hàng của người dùng hiện tại' })
  @Roles(RoleType.CUSTOMER)
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin giỏ hàng',
    type: CartResponseDto,
  })
  async getCart(@Req() req): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user['id']);
    return this.cartService.getCart(currentUser.id);
  }

  @Post(':dishId')
  @ApiOperation({ summary: 'Thêm một món ăn vào giỏ hàng bằng ID món ăn' })
  @ApiParam({
    name: 'dishId',
    description: 'ID của món ăn cần thêm vào giỏ hàng',
  })
  @ApiQuery({
    name: 'quantity',
    required: false,
    description: 'Số lượng món ăn (mặc định là 1)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin giỏ hàng sau khi thêm sản phẩm',
    type: CartResponseDto,
  })
  @Roles(RoleType.CUSTOMER)
  async addDishToCart(
    @Req() req,
    @Param('dishId', ParseIntPipe) dishId: number,
    @Query('quantity', new ParseIntPipe({ optional: true }))
    quantity: number = 1,
  ): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user.id);
    return this.cartService.addDishToCart(currentUser.id, dishId, quantity);
  }

  @Patch('item/:dishId')
  @ApiOperation({ summary: 'Cập nhật số lượng món ăn trong giỏ hàng' })
  @ApiParam({ name: 'dishId', description: 'ID của món ăn cần cập nhật' })
  @ApiBody({
    type: UpdateCartItemDto,
    description: 'Thông tin cập nhật số lượng món ăn',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin giỏ hàng sau khi cập nhật',
    type: CartResponseDto,
  })
  @Roles(RoleType.CUSTOMER)
  async updateCartItem(
    @Req() req,
    @Param('dishId') dishId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user.id);
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
  @Roles(RoleType.CUSTOMER)
  async removeCartItem(
    @Req() req,
    @Param('dishId') dishId: number,
  ): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user.id);
    return this.cartService.removeItem(currentUser.id, dishId);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Xóa toàn bộ giỏ hàng thành công',
    type: CartResponseDto,
  })
  @Roles(RoleType.CUSTOMER)
  async clearCart(@Req() req): Promise<CartResponseDto> {
    const currentUser = await this.userService.getCurrentUser(req.user.id);
    return this.cartService.clearCart(currentUser.id);
  }
}