import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from './category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    accountId: number,
  ): Promise<Category> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant not found for account ID ${accountId}`,
      );
    }

    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      restaurant: restaurant,
    });

    return this.categoryRepository.save(category);
  }

  async findById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findByAccountId(accountId: number): Promise<Category[]> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant not found for account ID ${accountId}`,
      );
    }

    return this.categoryRepository.find({
      where: { restaurant: { id: restaurant.id } },
      relations: ['restaurant'],
    });
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findById(id);

    Object.assign(category, updateCategoryDto);

    return this.categoryRepository.save(category);
  }

  async updateImage(id: number, imageUrl: string): Promise<Category> {
    throw new NotFoundException('Tính năng này đã bị vô hiệu hóa');
  }

  async remove(id: number, accountId: number): Promise<void> {
    const category = await this.findById(id);
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant not found for account ID ${accountId}`,
      );
    }

    if (category.restaurant.id !== restaurant.id) {
      throw new NotFoundException('Bạn không có quyền xóa danh mục này');
    }

    await this.categoryRepository.remove(category);
  }

  async getCategoriesByAccountId(
    accountId: number,
  ): Promise<CategoryResponseDto[]> {
    const categories = await this.findByAccountId(accountId);

    return categories.map((category) => ({
      id: category.id,
      restaurant_id: category.restaurant ? category.restaurant.id : null,
      name: category.name,
    }));
  }

  async getRestaurantIdByAccountId(accountId: number): Promise<number> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant not found for account ID ${accountId}`,
      );
    }

    return restaurant.id;
  }
}
