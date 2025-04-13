import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
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
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/base/cloudinary/cloudinary.service';
import * as Multer from 'multer';
import { Public } from '../auth/decorator/public.decorator';
import { UpdateUserDto, UserResponseDto } from './user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Lấy thông tin cá nhân của người dùng đang đăng nhập',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng',
    type: UserResponseDto,
  })
  @Roles(RoleType.CUSTOMER)
  async getProfile(@Req() req) {
    return this.userService.getCurrentUser(req.user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng',
    type: UserResponseDto,
  })
  @Roles(RoleType.CUSTOMER)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin và/hoặc ảnh đại diện người dùng' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        full_name: { type: 'string', example: 'Nguyen Van A' },
        phone: { type: 'string', example: '0987654321' },
        address: { type: 'string', example: 'Hà Nội' },
        avatar: { 
          type: 'string', 
          format: 'binary',
          description: 'File ảnh đại diện' 
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng sau khi cập nhật',
    type: UserResponseDto,
  })
  @UseInterceptors(FileInterceptor('avatar'))
  @Roles(RoleType.CUSTOMER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Multer.File,
    @Req() req,
  ) {
    // Kiểm tra người dùng chỉ có thể cập nhật thông tin của chính mình
    const user = await this.userService.findById(id);
    if (!user.account) {
      throw new NotFoundException(`Account not found for user with ID ${user.id}`);
    }
    if (user.account.id !== req.user.id) {
      throw new BadRequestException('Bạn không có quyền cập nhật thông tin này');
    }

    // Cập nhật thông tin
    let updatedUser = user;
    
    // Nếu có dữ liệu cập nhật
    if (Object.keys(updateUserDto).length > 0) {
      updatedUser = await this.userService.update(id, updateUserDto);
    }
    
    // Nếu có file ảnh
    if (file) {
      try {
        const cloudinaryResponse = await this.cloudinaryService.uploadImage(file);
        const avatarUrl = cloudinaryResponse.secure_url;
        updatedUser = await this.userService.updateAvatar(id, avatarUrl);
      } catch (error) {
        throw new BadRequestException(`Không thể tải lên ảnh: ${error.message}`);
      }
    }

    return updatedUser;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa người dùng' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Người dùng đã được xóa thành công',
  })
  @Roles(RoleType.CUSTOMER)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    await this.userService.remove(id, req.user.id);
    return { message: 'Người dùng đã được xóa thành công' };
  }
}
