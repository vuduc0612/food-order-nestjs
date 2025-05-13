import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Req,
  Body,
  Query,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { RoleType } from '../account_role/enums/role-type.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/base/cloudinary/cloudinary.service';
import * as Multer from 'multer';
import { UpdateRestaurantDto, RestaurantResponseDto } from './restaurant.dto';
import { Public } from '../auth/decorator/public.decorator';

@ApiTags('Restaurants')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('restaurants')
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Lấy thông tin nhà hàng đang đăng nhập cùng danh sách món ăn',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin nhà hàng và danh sách món ăn',
    type: RestaurantResponseDto,
  })
  @Roles(RoleType.RESTAURANT)
  async getProfile(@Req() req) {
    console.log('User requesting profile:', req.user);
    return this.restaurantService.getCurrentRestaurant(req.user.id);
  }

  @Public()
  @Get('public/:id')
  @ApiOperation({
    summary: 'Lấy thông tin nhà hàng theo ID (public endpoint không cần đăng nhập)',
  })
  @ApiParam({ name: 'id', description: 'ID của nhà hàng' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin nhà hàng và danh sách món ăn',
    type: RestaurantResponseDto,
  })
  async getPublicRestaurantById(@Param('id', ParseIntPipe) id: number) {
    return this.restaurantService.getRestaurantWithDishes(id);
  }

  @Public()
  @Get('by-type')
  @ApiOperation({ summary: 'Lấy danh sách nhà hàng theo loại (có phân trang)' })
  @ApiQuery({ 
    name: 'type', 
    description: 'Loại nhà hàng cần tìm', 
    required: true,
    type: String,
  })
  @ApiQuery({ 
    name: 'page', 
    description: 'Số trang (bắt đầu từ 0)', 
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Số lượng kết quả mỗi trang',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách nhà hàng theo loại',
    type: [RestaurantResponseDto],
  })
  async findByType(
    @Query('type') type: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
  ) {
    return this.restaurantService.getRestaurantsByType(type, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin nhà hàng theo ID cùng danh sách món ăn',
  })
  @ApiParam({ name: 'id', description: 'ID của nhà hàng' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin nhà hàng và danh sách món ăn',
    type: RestaurantResponseDto,
  })
  @Roles(RoleType.RESTAURANT)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.restaurantService.getRestaurantWithDishes(id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả nhà hàng (có phân trang)' })
  @ApiQuery({ 
    name: 'page', 
    description: 'Số trang (bắt đầu từ 0)', 
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Số lượng kết quả mỗi trang',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'keyword',
    description: 'Từ khóa tìm kiếm',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách nhà hàng',
    type: [RestaurantResponseDto],
  })
  async findAll(
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('keyword') keyword: string = '',
  ) {
    return this.restaurantService.getAllRestaurants(page, limit, keyword);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin và/hoặc ảnh nhà hàng' })
  @ApiParam({ name: 'id', description: 'ID của nhà hàng' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Nhà hàng ABC' },
        description: { type: 'string', example: 'Nhà hàng ngon nhất Hà Nội' },
        address: { type: 'string', example: '123 Đường ABC, Hà Nội' },
        phone: { type: 'string', example: '0987654321' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin nhà hàng sau khi cập nhật',
    type: RestaurantResponseDto,
  })
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @UploadedFile() file: Multer.File,
  ) {
    const restaurant = await this.restaurantService.findById(id);
    
    // Cập nhật thông tin
    let updatedRestaurant = restaurant;

    // Nếu có dữ liệu cập nhật
    if (Object.keys(updateRestaurantDto).length > 0) {
      updatedRestaurant = await this.restaurantService.update(
        id,
        updateRestaurantDto,
      );
    }

    // Nếu có file ảnh
    if (file) {
      try {
        const cloudinaryResponse =
          await this.cloudinaryService.uploadImage(file);
        const imageUrl = cloudinaryResponse.secure_url;
        updatedRestaurant = await this.restaurantService.updateImage(
          id,
          imageUrl,
        );
      } catch (error) {
        throw new BadRequestException(
          `Không thể tải lên ảnh: ${error.message}`,
        );
      }
    }

    // Lấy dữ liệu đầy đủ của nhà hàng (bao gồm danh sách món ăn)
    return this.restaurantService.getRestaurantWithDishes(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa nhà hàng' })
  @ApiParam({ name: 'id', description: 'ID của nhà hàng' })
  @ApiResponse({
    status: 200,
    description: 'Nhà hàng đã được xóa thành công',
  })
  @Roles(RoleType.RESTAURANT)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    await this.restaurantService.remove(id, req.user.id);
    return { message: 'Nhà hàng đã được xóa thành công' };
  }
}