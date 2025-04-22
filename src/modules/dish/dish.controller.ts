import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  Req,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { DishService } from './dish.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { RoleType } from '../account_role/enums/role-type.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { DishDto, CreateDishDto, UpdateDishDto, PageDto } from './dish.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/base/cloudinary/cloudinary.service';
import * as Multer from 'multer';

@ApiTags('Dishes')
@ApiBearerAuth()
@Controller('dishes')
@UseGuards(AuthGuard, RolesGuard)
export class DishController {
  constructor(
    private readonly dishService: DishService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả món ăn (có phân trang)' })
  @ApiQuery({
    name: 'page',
    description: 'Số trang (bắt đầu từ 0)',
    type: Number,
    required: false,
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Số lượng kết quả mỗi trang',
    type: Number,
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách món ăn',
    type: PageDto,
  })
  @Roles(RoleType.RESTAURANT)
  async getAllDishes(
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Req() req,
  ): Promise<PageDto<DishDto>> {
    return this.dishService.getAllDishByRestaurant(req.user.id, page, limit);
  }

  @Get('restaurant/:restaurantId')
  @ApiOperation({
    summary: 'Lấy danh sách món ăn của nhà hàng (có phân trang)',
  })
  @ApiParam({
    name: 'restaurantId',
    description: 'ID của nhà hàng (không cần thiết nếu đã đăng nhập)',
  })
  @ApiQuery({
    name: 'page',
    description: 'Số trang (bắt đầu từ 0)',
    type: Number,
    required: false,
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Số lượng kết quả mỗi trang',
    type: Number,
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách món ăn',
    type: PageDto,
  })
  @Roles(RoleType.RESTAURANT)
  async getAllDishByRestaurant(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Req() req,
  ): Promise<PageDto<DishDto>> {
    return this.dishService.getAllDishByRestaurant(req.user.id, page, limit);
  }

  @Get('category/:categoryId')
  @ApiOperation({
    summary: 'Lấy danh sách món ăn trong danh mục của nhà hàng (có phân trang)',
  })
  @ApiParam({ name: 'categoryId', description: 'ID của danh mục' })
  @ApiQuery({
    name: 'page',
    description: 'Số trang (bắt đầu từ 0)',
    type: Number,
    required: false,
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Số lượng kết quả mỗi trang',
    type: Number,
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách món ăn',
    type: PageDto,
  })
  @Roles(RoleType.RESTAURANT)
  async getAllDishByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Req() req,
  ): Promise<PageDto<DishDto>> {
    return this.dishService.getAllDishByCategory(
      categoryId,
      req.user.id,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin món ăn theo ID' })
  @ApiParam({ name: 'id', description: 'ID của món ăn' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin món ăn',
    type: DishDto,
  })
  @Roles(RoleType.RESTAURANT)
  async getDishById(@Param('id', ParseIntPipe) id: number): Promise<DishDto> {
    return this.dishService.getDishById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới món ăn' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Phở bò' },
        description: { type: 'string', example: 'Món phở truyền thống' },
        price: { type: 'number', example: 50000 },
        category: { type: 'string', example: 'Món chính' },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh món ăn',
        },
      },
      required: ['name', 'price', 'category'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Món ăn đã được tạo thành công',
    type: DishDto,
  })
  @UseInterceptors(FileInterceptor('thumbnail'))
  @Roles(RoleType.RESTAURANT)
  async createDish(
    @Body() createDishDto: CreateDishDto,
    @UploadedFile() file: Multer.File,
    @Req() req,
  ): Promise<DishDto> {
    // Xử lý file ảnh nếu có
    if (file) {
      try {
        const cloudinaryResponse =
          await this.cloudinaryService.uploadImage(file);
        createDishDto.thumbnail = cloudinaryResponse.secure_url;
      } catch (error) {
        throw new BadRequestException(
          `Không thể tải lên ảnh: ${error.message}`,
        );
      }
    }

    return this.dishService.createDish(createDishDto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin và/hoặc hình ảnh món ăn' })
  @ApiParam({ name: 'id', description: 'ID của món ăn' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Phở bò' },
        description: { type: 'string', example: 'Món phở truyền thống' },
        price: { type: 'number', example: 50000 },
        category: { type: 'string', example: 'Món chính' },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh món ăn',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin món ăn sau khi cập nhật',
    type: DishDto,
  })
  @UseInterceptors(FileInterceptor('thumbnail'))
  @Roles(RoleType.RESTAURANT)
  async updateDish(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDishDto: UpdateDishDto,
    @UploadedFile() file: Multer.File,
    @Req() req,
  ): Promise<DishDto> {
    // Nếu có file ảnh
    if (file) {
      try {
        const cloudinaryResponse =
          await this.cloudinaryService.uploadImage(file);
        const thumbnailUrl = cloudinaryResponse.secure_url;
        // Cập nhật URL thumbnail vào DTO
        updateDishDto.thumbnail = thumbnailUrl;
      } catch (error) {
        throw new BadRequestException(
          `Không thể tải lên ảnh: ${error.message}`,
        );
      }
    }

    // Cập nhật thông tin
    return this.dishService.updateDish(id, updateDishDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá món ăn' })
  @ApiParam({ name: 'id', description: 'ID của món ăn' })
  @ApiResponse({
    status: 200,
    description: 'Món ăn đã được xoá thành công',
  })
  @Roles(RoleType.RESTAURANT)
  async deleteDish(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<void> {
    return this.dishService.deleteDish(id, req.user.id);
  }

  @Post('seed-fake-data')
  @ApiOperation({ summary: 'Tạo dữ liệu mẫu các món ăn cho nhà hàng' })
  @ApiResponse({
    status: 201,
    description: 'Dữ liệu mẫu đã được tạo thành công',
    type: [DishDto],
  })
  @Roles(RoleType.RESTAURANT)
  async seedFakeData(@Req() req): Promise<DishDto[]> {
    return this.dishService.seedFakeData(req.user.id);
  }
}
