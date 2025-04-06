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
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng sau khi cập nhật',
    type: UserResponseDto,
  })
  @Roles(RoleType.CUSTOMER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req,
  ) {
    // Kiểm tra người dùng chỉ có thể cập nhật thông tin của chính mình
    const user = await this.userService.findById(id);
    if (user.account.id !== req.user.id) {
      throw new BadRequestException(
        'Bạn không có quyền cập nhật thông tin này',
      );
    }

    return this.userService.update(id, updateUserDto);
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
    // Kiểm tra người dùng chỉ có thể xóa chính mình
    const user = await this.userService.findById(id);
    if (user.account.id !== req.user.id) {
      throw new BadRequestException('Bạn không có quyền xóa thông tin này');
    }

    await this.userService.remove(id);
    return { message: 'Người dùng đã được xóa thành công' };
  }

  @Post(':id/upload-avatar')
  @ApiOperation({ summary: 'Upload ảnh đại diện cho người dùng' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File ảnh đại diện',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ảnh đại diện đã được cập nhật thành công',
  })
  @UseInterceptors(FileInterceptor('avatar'))
  @Roles(RoleType.CUSTOMER)
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Multer.File,
    @Req() req,
  ) {
    if (!file) {
      throw new BadRequestException('Không có file nào được tải lên');
    }

    // Kiểm tra người dùng chỉ có thể cập nhật ảnh đại diện của chính mình
    const user = await this.userService.findById(id);
    if (user.account.id !== req.user.id) {
      throw new BadRequestException(
        'Bạn không có quyền cập nhật ảnh đại diện này',
      );
    }

    try {
      const cloudinaryResponse = await this.cloudinaryService.uploadImage(file);
      const avatarUrl = cloudinaryResponse.secure_url;

      const updatedUser = await this.userService.updateAvatar(id, avatarUrl);

      return {
        message: 'Ảnh đại diện đã được cập nhật thành công',
        data: updatedUser,
      };
    } catch (error) {
      throw new BadRequestException(`Không thể tải lên ảnh: ${error.message}`);
    }
  }
}
