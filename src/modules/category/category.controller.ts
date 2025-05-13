import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  Req,
  Body,
} from '@nestjs/common';
import { CategoryService } from './category.service';
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
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from './category.dto';
import { Public } from '../auth/decorator/public.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới danh mục' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Danh mục đã được tạo thành công',
    type: CategoryResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.RESTAURANT)
  async create(@Body() createCategoryDto: CreateCategoryDto, @Req() req) {
    return this.categoryService.create(createCategoryDto, req.user.id);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả danh mục',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách danh mục',
    type: [CategoryResponseDto],
  })
  async getAllCategories(@Req() req) {
    if (req.user) {
      return this.categoryService.getCategoriesByAccountId(req.user.id);
    }
    return this.categoryService.findAllPublic();
  }
  
  @Public()
  @Get('restaurant/:id')
  @ApiOperation({
    summary: 'Lấy danh sách danh mục theo ID nhà hàng (public endpoint)',
  })
  @ApiParam({ name: 'id', description: 'ID của nhà hàng' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách danh mục của nhà hàng',
    type: [CategoryResponseDto],
  })
  async getCategoriesByRestaurant(@Param('id', ParseIntPipe) restaurantId: number) {
    return this.categoryService.getCategoriesByRestaurantId(restaurantId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Lấy thông tin danh mục theo ID' })
  @ApiParam({ name: 'id', description: 'ID của danh mục' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin danh mục',
    type: CategoryResponseDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const category = await this.categoryService.findById(id);

    if (!category) {
      throw new BadRequestException('Danh mục không tồn tại');
    }

    if (req.user) {
      // Đảm bảo category có thuộc tính restaurant
      if (!category.restaurant) {
        throw new BadRequestException('Danh mục không hợp lệ');
      }

      // Kiểm tra xem category có thuộc về nhà hàng của người dùng không
      const restaurantId = await this.categoryService.getRestaurantIdByAccountId(
        req.user.id,
      );

      if (category.restaurant.id !== restaurantId) {
        throw new BadRequestException(
          'Bạn không có quyền xem thông tin danh mục này',
        );
      }
    }

    return category;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin danh mục' })
  @ApiParam({ name: 'id', description: 'ID của danh mục' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'Thông tin danh mục sau khi cập nhật',
    type: CategoryResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.RESTAURANT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req,
  ) {
    const category = await this.categoryService.findById(id);

    if (!category.restaurant) {
      throw new BadRequestException('Danh mục không hợp lệ');
    }

    const restaurantId = await this.categoryService.getRestaurantIdByAccountId(
      req.user.id,
    );

    if (category.restaurant.id !== restaurantId) {
      throw new BadRequestException(
        'Bạn không có quyền cập nhật thông tin này',
      );
    }

    return this.categoryService.update(id, updateCategoryDto);
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Xóa danh mục' })
  @ApiParam({ name: 'id', description: 'ID của danh mục' })
  @ApiResponse({
    status: 200,
    description: 'Danh mục đã được xóa thành công',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.RESTAURANT)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    await this.categoryService.remove(id, req.user.id);
    return { message: 'Danh mục đã được xóa thành công' };
  }
}
