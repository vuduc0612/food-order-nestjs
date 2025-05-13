import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  Req,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { DishService } from './dish.service';
import {
  ApiTags,
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
import { Public } from '../auth/decorator/public.decorator';

@Public()
@ApiTags('Dishes')
@Controller('dishes')
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

  @Get('public-category/:categoryId')
  @ApiOperation({
    summary: 'Lấy danh sách món ăn trong danh mục không cần ID nhà hàng (có phân trang)',
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
  async getPublicDishByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
  ): Promise<PageDto<DishDto>> {
    return this.dishService.getPublicDishByCategory(
      categoryId,
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
        restaurantId: { 
          type: 'number', 
          example: 1, 
          description: 'ID của nhà hàng (bắt buộc khi không đăng nhập)' 
        },
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

    // Luôn ưu tiên sử dụng restaurantId từ form
    const restaurantId = createDishDto.restaurantId || req.user?.id;
    if (!restaurantId) {
      throw new BadRequestException('Vui lòng cung cấp restaurantId');
    }

    try {
      return this.dishService.createDish(createDishDto, restaurantId);
    } catch (error) {
      console.error('Error creating dish:', error);
      throw new BadRequestException(
        `Không thể tạo món ăn: ${error.message}`,
      );
    }
  }

  @Public()
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

    // Luôn sử dụng ID nhà hàng là 1 để đơn giản hóa
    const restaurantId = 1;
    
    try {
      console.log(`Updating dish ${id} with:`, updateDishDto);
      // Tìm món ăn hiện tại
      const currentDish = await this.dishService.getDishById(id);
      console.log(`Current dish found:`, currentDish);
      
      // Đảm bảo restaurantId được thiết lập trong DTO
      if (!updateDishDto.restaurantId) {
        updateDishDto.restaurantId = restaurantId;
      }
      
      // Gọi service để cập nhật
      return this.dishService.updateDish(id, updateDishDto, restaurantId);
    } catch (error) {
      console.error('Error updating dish:', error);
      throw new BadRequestException(
        `Không thể cập nhật món ăn: ${error.message}`,
      );
    }
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Xoá món ăn' })
  @ApiParam({ name: 'id', description: 'ID của món ăn' })
  @ApiResponse({
    status: 200,
    description: 'Món ăn đã được xoá thành công',
  })
  async deleteDish(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<void> {
    // Bỏ kiểm tra userId, cung cấp ID mặc định là 1
    const userId = 1; // Sử dụng ID mặc định, không cần xác thực
    return this.dishService.deleteDish(id, userId);
  }

  @Post('seed-fake-data')
  @ApiOperation({ summary: 'Tạo dữ liệu mẫu các món ăn cho nhà hàng' })
  @ApiResponse({
    status: 201,
    description: 'Dữ liệu mẫu đã được tạo thành công',
    type: [DishDto],
  })
  async seedFakeData(@Req() req): Promise<DishDto[]> {
    return this.dishService.seedFakeData(req.user.id);
  }

  @Public()
  @Post('simple')
  @ApiOperation({ summary: 'Thêm món ăn đơn giản không cần xác thực' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Phở bò' },
        description: { type: 'string', example: 'Món phở truyền thống' },
        price: { type: 'number', example: 50000 },
        category: { type: 'string', example: 'Món chính' },
        thumbnail: { type: 'string', example: 'https://example.com/image.jpg' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Món ăn đã được tạo thành công',
    type: DishDto,
  })
  async createSimpleDish(
    @Body() createDishDto: CreateDishDto,
  ): Promise<any> {
    try {
      // Fixed restaurant info
      const restaurantInfo = {
        id: 1,
        name: 'Nhà hàng mặc định',
        accountId: 1
      };
      
      // Tìm hoặc tạo danh mục
      // Thay vì sử dụng phương thức không tồn tại, gọi trực tiếp đến dishService.getOrCreateCategory
      const category = await this.dishService.createDish(createDishDto, restaurantInfo.id);
      
      return category;
    } catch (error) {
      console.error('Error in createSimpleDish:', error);
      throw new BadRequestException(
        `Không thể tạo món ăn đơn giản: ${error.message}`,
      );
    }
  }
}
