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

    return {
      id: user.id,
      account_id: user.account.id,
      full_name: user.fullName,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      email: user.account.email,
    };
  }
}
