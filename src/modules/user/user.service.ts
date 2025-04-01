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
      where: { id }
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByAccountId(accountId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { account_id: accountId }
    });
    
    if (!user) {
      throw new NotFoundException(`User with account ID ${accountId} not found`);
    }
    
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    Object.assign(user, updateUserDto);
    
    return this.userRepository.save(user);
  }

  async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    const user = await this.findById(id);
    
    user.avatar = avatarUrl;
    
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    
    await this.userRepository.remove(user);
  }

  async getCurrentUser(accountId: number): Promise<UserResponseDto> {
    const user = await this.findByAccountId(accountId);
    const account = await this.accountRepository.findOne({
      where: { id: user.account_id }
    });
    
    return {
      id: user.id,
      account_id: user.account_id,
      full_name: user.full_name,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      email: account.email,
    };
  }
}
