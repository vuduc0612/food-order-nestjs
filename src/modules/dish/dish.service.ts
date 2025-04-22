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
    return this.paginateDishes({}, page, limit);
  }

  async getAllDishByRestaurant(
    accountId: number,
    page: number,
    limit: number,
  ): Promise<PageDto<DishDto>> {
    const restaurant = await this.findRestaurantByAccountId(accountId);
    return this.paginateDishes({ restaurant: { id: restaurant.id } }, page, limit);
  }

  async getAllDishByCategory(
    categoryId: number,
    accountId: number,
    page: number,
    limit: number,
  ): Promise<PageDto<DishDto>> {
    const restaurant = await this.findRestaurantByAccountId(accountId);
    const category = await this.findCategoryByIdAndRestaurant(categoryId, restaurant.id);

    return this.paginateDishes(
      { restaurant: { id: restaurant.id }, category: { id: categoryId } },
      page,
      limit,
    );
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

  async createDish(dishDto: CreateDishDto, accountId: number): Promise<DishDto> {
    const restaurant = await this.findRestaurantByAccountId(accountId);
    const category = await this.findOrCreateCategory(dishDto.category, restaurant);

    const dish = this.dishRepository.create({
      ...dishDto,
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
    const dish = await this.findDishByIdAndAccountId(id, accountId);

    Object.assign(dish, dishDto);

    if (dishDto.category) {
      dish.category = await this.findOrCreateCategory(dishDto.category, dish.restaurant);
    }

    const updatedDish = await this.dishRepository.save(dish);
    return this.mapToDishDto(updatedDish);
  }

  async deleteDish(id: number, accountId: number): Promise<void> {
    const dish = await this.findDishByIdAndAccountId(id, accountId);
    await this.dishRepository.delete(dish.id);
  }

  private async paginateDishes(
    where: object,
    page: number,
    limit: number,
  ): Promise<PageDto<DishDto>> {
    const skip = page * limit;
    const [dishes, total] = await this.dishRepository.findAndCount({
      where,
      skip,
      take: limit,
      relations: ['category', 'restaurant'],
    });

    return {
      content: dishes.map((dish) => this.mapToDishDto(dish)),
      number: page,
      size: limit,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async findRestaurantByAccountId(accountId: number): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant not found for account ID: ${accountId}`);
    }

    return restaurant;
  }

  private async findCategoryByIdAndRestaurant(
    categoryId: number,
    restaurantId: number,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['restaurant'],
    });

    if (!category || category.restaurant.id !== restaurantId) {
      throw new BadRequestException('Category not found in your restaurant');
    }

    return category;
  }

  private async findOrCreateCategory(
    categoryName: string,
    restaurant: Restaurant,
  ): Promise<Category> {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: categoryName, restaurant: { id: restaurant.id } },
    });

    if (existingCategory) {
      return existingCategory;
    }

    const newCategory = this.categoryRepository.create({
      name: categoryName,
      restaurant,
    });

    return this.categoryRepository.save(newCategory);
  }

  private async findDishByIdAndAccountId(id: number, accountId: number): Promise<Dish> {
    const dish = await this.dishRepository.findOne({
      where: { id },
      relations: ['category', 'restaurant'],
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    if (dish.restaurant.accountId !== accountId) {
      throw new BadRequestException('You do not have permission to access this dish');
    }

    return dish;
  }

  // Helper methods to reduce code duplication
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
      throw new NotFoundException('Category not found');
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
    const { page, limit, where = {} } = options;
    const skip = page * limit;
    
    const [dishes, total] = await this.dishRepository.findAndCount({
      where,
      skip,
      take: limit,
      relations: ['category', 'restaurant'],
    });

    return {
      content: dishes.map((dish) => this.mapToDishDto(dish)),
      number: page,
      size: limit,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapToDishDto(dish: Dish): DishDto {
    return {
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      thumbnail: dish.thumbnail,
      category: dish.category.name,
      restaurantId: dish.restaurant.id,
    };
  }
}