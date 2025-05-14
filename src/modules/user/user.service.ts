import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto, UserResponseDto } from './user.dto';
import { Account } from '../account/entities/account.entities';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['account'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByAccountId(accountId: number): Promise<User> {
    return this.userRepository.findOne({
      where: { account: { id: accountId } },
      relations: ['account'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Xử lý đặc biệt cho trường full_name từ DTO
    if (updateUserDto.full_name !== undefined) {
      user.fullName = updateUserDto.full_name;
      delete updateUserDto.full_name; // Xóa để tránh Object.assign gán lại
    }

    Object.assign(user, updateUserDto);

    const updatedUser = await this.userRepository.save(user);
    return this.findById(updatedUser.id);
  }

  async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    const user = await this.findById(id);

    user.avatar = avatarUrl;

    const updatedUser = await this.userRepository.save(user);
    return this.findById(updatedUser.id);
  }

  async remove(id: number, accountId: number): Promise<void> {
    const user = await this.findById(id);

    if (!user.account || user.account.id !== accountId) {
      throw new NotFoundException(
        'Bạn không có quyền xóa thông tin người dùng này',
      );
    }

    await this.userRepository.remove(user);
  }

  async getCurrentUser(accountId: number): Promise<UserResponseDto> {
    const user = await this.findByAccountId(accountId);
    if (!user) {
      throw new NotFoundException(
        `User with account ID ${accountId} not found`,
      );
    }

    if (!user.account) {
      throw new NotFoundException(
        `Account not found for user with ID ${user.id}`,
      );
    }

    return this.mapToUserDto(user);
  }

  async create(fullName: string, phone: string, address: string, accountId: number): Promise<User> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    const newUser = this.userRepository.create({
      fullName,
      phone,
      address,
      accountId,
    });

    return this.userRepository.save(newUser);
  }

  async removePublic(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  // Hàm tiện ích để map từ entity sang DTO
  mapToUserDto(user: User): UserResponseDto {
    return {
      id: user.id,
      account_id: user.account?.id,
      full_name: user.fullName,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      email: user.account?.email,
      username: user.account?.email?.split('@')[0], // Mặc định lấy phần trước @ làm username
      isActive: user.account?.is_verified,
      createdAt: user.account?.created_at,
    };
  }

  // Hàm lấy danh sách tất cả người dùng cho admin dashboard
  async findAll(page: number = 0, limit: number = 10): Promise<{
    items: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = page * limit;
    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      relations: ['account'],
      order: {
        id: 'DESC',
      },
    });

    const userDtos = users.map(user => this.mapToUserDto(user));

    return {
      items: userDtos,
      total,
      page,
      limit,
    };
  }
}
