import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dish } from './entities/dish.entity';
import { Category } from '../category/entities/category.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { DishDto, CreateDishDto, UpdateDishDto, PageDto } from './dish.dto';

@Injectable()
export class DishService {
  constructor(
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async getAllDishes(page: number, limit: number): Promise<PageDto<DishDto>> {
    return this.getPaginatedDishes({ page, limit });
  }

  async getAllDishByRestaurant(
    accountId: number,
    page: number,
    limit: number,
  ): Promise<PageDto<DishDto>> {
    const restaurant = await this.getRestaurantByAccountId(accountId);
    return this.getPaginatedDishes({
      page,
      limit,
      where: { restaurant: { id: restaurant.id } },
    });
  }

  async getAllDishByCategory(
    categoryId: number,
    accountId: number,
    page: number,
    limit: number,
  ): Promise<PageDto<DishDto>> {
    const restaurant = await this.getRestaurantByAccountId(accountId);
    const category = await this.getCategoryById(categoryId);

    if (category.restaurant.id !== restaurant.id) {
      throw new BadRequestException('Category not found in your restaurant');
    }

    return this.getPaginatedDishes({
      page,
      limit,
      where: {
        restaurant: { id: restaurant.id },
        category: { id: categoryId },
      },
    });
  }

  async getDishById(id: number): Promise<DishDto> {
    const dish = await this.dishRepository.findOne({
      where: { id },
      relations: ['category', 'restaurant'],
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    return this.mapToDishDto(dish);
  }

  async createDish(
    dishDto: CreateDishDto,
    accountId: number,
  ): Promise<DishDto> {
    const restaurant = await this.getRestaurantByAccountId(accountId);
    const category = await this.getOrCreateCategory(dishDto.category, restaurant.id);

    const dish = this.dishRepository.create({
      name: dishDto.name,
      price: dishDto.price,
      description: dishDto.description,
      thumbnail: dishDto.thumbnail,
      restaurant,
      category,
    });

    const savedDish = await this.dishRepository.save(dish);
    return this.mapToDishDto(savedDish);
  }

  async updateDish(
    id: number,
    dishDto: UpdateDishDto,
    accountId: number,
  ): Promise<DishDto> {
    const dish = await this.dishRepository.findOne({
      where: { id },
      relations: ['category', 'restaurant'],
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    if (dish.restaurant.accountId !== accountId) {
      throw new BadRequestException('You do not have permission to update this dish');
    }

    // Update dish properties if they exist in DTO
    Object.assign(dish, {
      name: dishDto.name ?? dish.name,
      price: dishDto.price ?? dish.price,
      description: dishDto.description ?? dish.description,
      thumbnail: dishDto.thumbnail ?? dish.thumbnail,
    });

    if (dishDto.category) {
      dish.category = await this.getOrCreateCategory(dishDto.category, dish.restaurant.id);
    }

    const updatedDish = await this.dishRepository.save(dish);
    return this.mapToDishDto(updatedDish);
  }

  async deleteDish(id: number, accountId: number): Promise<void> {
    const dish = await this.dishRepository.findOne({
      where: { id },
      relations: ['category', 'restaurant'],
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    if (dish.restaurant.accountId !== accountId) {
      throw new BadRequestException('You do not have permission to delete this dish');
    }

    await this.dishRepository.delete(dish.id);
  }

  private async getRestaurantByAccountId(accountId: number): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant not found for account ID: ${accountId}`);
    }

    return restaurant;
  }

  private async getCategoryById(categoryId: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['restaurant'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return category;
  }

  private async getOrCreateCategory(categoryName: string, restaurantId: number): Promise<Category> {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: categoryName, restaurant: { id: restaurantId } },
    });

    if (existingCategory) {
      return existingCategory;
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
    }

    const newCategory = this.categoryRepository.create({
      name: categoryName,
      restaurant,
    });

    return this.categoryRepository.save(newCategory);
  }

  private async getPaginatedDishes(options: {
    page: number;
    limit: number;
    where?: any;
  }): Promise<PageDto<DishDto>> {
    const skip = options.page * options.limit;
    const [dishes, total] = await this.dishRepository.findAndCount({
      where: options.where,
      skip,
      take: options.limit,
      relations: ['category', 'restaurant'],
    });

    return {
      content: dishes.map((dish) => this.mapToDishDto(dish)),
      number: options.page,
      size: options.limit,
      totalElements: total,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  private mapToDishDto(dish: Dish): DishDto {
    return {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      description: dish.description,
      thumbnail: dish.thumbnail,
      category: {
        id: dish.category.id,
        name: dish.category.name,
      },
      restaurant: {
        id: dish.restaurant.id,
        name: dish.restaurant.name,
      },
      isAvailable: dish.isAvailable ?? true,
    };
  }
}