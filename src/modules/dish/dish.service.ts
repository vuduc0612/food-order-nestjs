import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    const skip = page * limit;
    const [dishes, total] = await this.dishRepository.findAndCount({
      skip,
      take: limit,
      relations: ['category', 'restaurant'],
    });

    return {
      content: dishes.map(dish => this.mapToDishDto(dish)),
      number: page,
      size: limit,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllDishByRestaurant(accountId: number, page: number, limit: number): Promise<PageDto<DishDto>> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant not found for account ID: ${accountId}`);
    }

    const skip = page * limit;
    const [dishes, total] = await this.dishRepository.findAndCount({
      where: { restaurant: { id: restaurant.id } },
      skip,
      take: limit,
      relations: ['category', 'restaurant'],
    });

    return {
      content: dishes.map(dish => this.mapToDishDto(dish)),
      number: page,
      size: limit,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllDishByCategory(categoryId: number, accountId: number, page: number, limit: number): Promise<PageDto<DishDto>> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant not found for account ID: ${accountId}`);
    }

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['restaurant'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.restaurant.id !== restaurant.id) {
      throw new BadRequestException(`Category not found in your restaurant`);
    }

    const skip = page * limit;
    const [dishes, total] = await this.dishRepository.findAndCount({
      where: { 
        restaurant: { id: restaurant.id },
        category: { id: categoryId }
      },
      skip,
      take: limit,
      relations: ['category', 'restaurant'],
    });

    return {
      content: dishes.map(dish => this.mapToDishDto(dish)),
      number: page,
      size: limit,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
    };
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
    // Tìm restaurant dựa trên accountId thay vì restaurantId
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant not found for account ID: ${accountId}`);
    }

    // Check if category exists, if not create a new one
    let category: Category;
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: dishDto.category, restaurant: { id: restaurant.id } },
    });

    if (existingCategory) {
      category = existingCategory;
    } else {
      const newCategory = this.categoryRepository.create({
        name: dishDto.category,
        restaurant: restaurant,
      });
      category = await this.categoryRepository.save(newCategory);
    }

    const dish = this.dishRepository.create({
      name: dishDto.name,
      price: dishDto.price,
      description: dishDto.description,
      thumbnail: dishDto.thumbnail,
      restaurant: restaurant,
      category: category,
    });

    const savedDish = await this.dishRepository.save(dish);
    return this.mapToDishDto(savedDish);
  }

  async updateDish(id: number, dishDto: UpdateDishDto, accountId: number): Promise<DishDto> {
    const dish = await this.dishRepository.findOne({
      where: { id },
      relations: ['category', 'restaurant', 'restaurant.account'],
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }
    
    // Kiểm tra xem người dùng có quyền cập nhật món ăn này không
    if (dish.restaurant.accountId !== accountId) {
      throw new BadRequestException('You do not have permission to update this dish');
    }

    if (dishDto.name) {
      dish.name = dishDto.name;
    }

    if (dishDto.price) {
      dish.price = dishDto.price;
    }

    if (dishDto.description) {
      dish.description = dishDto.description;
    }

    if (dishDto.thumbnail) {
      dish.thumbnail = dishDto.thumbnail;
    }

    if (dishDto.category) {
      // Check if category exists, if not create a new one
      let category: Category;
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: dishDto.category, restaurant: { id: dish.restaurant.id } },
      });

      if (existingCategory) {
        category = existingCategory;
      } else {
        const newCategory = this.categoryRepository.create({
          name: dishDto.category,
          restaurant: dish.restaurant,
        });
        category = await this.categoryRepository.save(newCategory);
      }

      dish.category = category;
    }

    const updatedDish = await this.dishRepository.save(dish);
    return this.mapToDishDto(updatedDish);
  }

  async deleteDish(id: number, accountId: number): Promise<void> {
    const dish = await this.dishRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    // Kiểm tra xem người dùng có quyền xóa món ăn này không
    if (dish.restaurant.accountId !== accountId) {
      throw new BadRequestException('You do not have permission to delete this dish');
    }

    await this.dishRepository.delete(id);
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
