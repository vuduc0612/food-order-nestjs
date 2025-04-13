import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { UpdateRestaurantDto, RestaurantResponseDto } from './restaurant.dto';
import { DishService } from '../dish/dish.service';
import { DishDto } from '../dish/dish.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @Inject(forwardRef(() => DishService))
    private readonly dishService: DishService,
  ) {}

  async findById(id: number): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['account'],
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }

  async findByAccountId(accountId: number): Promise<Restaurant> {
    return this.restaurantRepository.findOne({
      where: { account: { id: accountId } },
      relations: ['account'],
    });
  }

  async update(id: number, updateRestaurantDto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.findById(id);

    Object.assign(restaurant, updateRestaurantDto);

    const updatedRestaurant = await this.restaurantRepository.save(restaurant);
    return this.findById(updatedRestaurant.id);
  }

  async updateImage(id: number, imageUrl: string): Promise<Restaurant> {
    const restaurant = await this.findById(id);

    restaurant.image_url = imageUrl;

    const updatedRestaurant = await this.restaurantRepository.save(restaurant);
    return this.findById(updatedRestaurant.id);
  }

  async remove(id: number, accountId: number): Promise<void> {
    const restaurant = await this.findById(id);

    if (!restaurant.account || restaurant.account.id !== accountId) {
      throw new NotFoundException(
        'Bạn không có quyền xóa thông tin nhà hàng này',
      );
    }

    await this.restaurantRepository.remove(restaurant);
  }

  async getCurrentRestaurant(accountId: number): Promise<RestaurantResponseDto> {
    const restaurant = await this.findByAccountId(accountId);
    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant with account ID ${accountId} not found`,
      );
    }

    if (!restaurant.account) {
      throw new NotFoundException(
        `Account not found for restaurant with ID ${restaurant.id}`,
      );
    }

    // Lấy danh sách món ăn của nhà hàng
    const dishesPage = await this.dishService.getAllDishByRestaurant(accountId, 0, 100);
    
    return {
      id: restaurant.id,
      account_id: restaurant.account.id,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone: restaurant.phone,
      image_url: restaurant.image_url,
      email: restaurant.account.email,
      dishes: dishesPage.content, // Thêm danh sách món ăn
    };
  }

  async getRestaurantWithDishes(id: number): Promise<RestaurantResponseDto> {
    const restaurant = await this.findById(id);
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    if (!restaurant.account) {
      throw new NotFoundException(`Account not found for restaurant with ID ${id}`);
    }

    // Lấy danh sách món ăn của nhà hàng
    const dishesPage = await this.dishService.getAllDishByRestaurant(restaurant.account.id, 0, 100);
    
    return {
      id: restaurant.id,
      account_id: restaurant.account.id,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone: restaurant.phone,
      image_url: restaurant.image_url,
      email: restaurant.account.email,
      dishes: dishesPage.content, // Thêm danh sách món ăn
    };
  }
}
