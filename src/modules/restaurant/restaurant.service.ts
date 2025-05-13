import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
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

  async update(
    id: number,
    updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<Restaurant> {
    const restaurant = await this.findById(id);

    Object.assign(restaurant, updateRestaurantDto);

    await this.restaurantRepository.save(restaurant);
    return this.findById(id);
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

  async getCurrentRestaurant(
    accountId: number,
  ): Promise<RestaurantResponseDto> {
    const restaurant = await this._getRestaurantWithAccount(accountId);

    const dishesPage = await this.dishService.getAllDishByRestaurant(
      accountId,
      0,
      100,
    );

    return this._mapToRestaurantResponseDto(restaurant, dishesPage.content);
  }

  async getRestaurantWithDishes(id: number): Promise<RestaurantResponseDto> {
    const restaurant = await this.findById(id);

    const dishesPage = await this.dishService.getAllDishByRestaurant(
      restaurant.account.id,
      0,
      100,
    );

    return this._mapToRestaurantResponseDto(restaurant, dishesPage.content);
  }

  /**
   * Lấy tất cả nhà hàng có phân trang
   * @param page Số trang (bắt đầu từ 0)
   * @param limit Số lượng kết quả mỗi trang
   */
  async getAllRestaurants(page: number = 0, limit: number = 10) {
    const skip = page * limit;
    
    const [restaurants, total] = await this.restaurantRepository.findAndCount({
      skip,
      take: limit,
      relations: ['account'],
      order: {
        id: 'DESC', // Lấy nhà hàng mới nhất trước
      },
    });

    // Convert restaurants to DTOs
    const restaurantDtos = [];
    for (const restaurant of restaurants) {
      // Không lấy dishes để tăng hiệu suất
      restaurantDtos.push({
        id: restaurant.id,
        account_id: restaurant.account?.id,
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        phone: restaurant.phone,
        image_url: restaurant.image_url,
        type: restaurant.type,
        email: restaurant.account?.email,
      });
    }

    return {
      content: restaurantDtos,
      number: page,
      size: limit,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy nhà hàng theo loại có phân trang
   * @param type Loại nhà hàng cần tìm
   * @param page Số trang (bắt đầu từ 0)
   * @param limit Số lượng kết quả mỗi trang
   */
  async getRestaurantsByType(type: string, page: number = 0, limit: number = 10) {
    const skip = page * limit;
    
    console.log(`Searching for restaurants with type: "${type}"`);
    
    try {
      // Use exact matching for type instead of partial matching
      const whereCondition = { type: type };
      
      console.log('Using query condition:', JSON.stringify(whereCondition));
      
      const [restaurants, total] = await this.restaurantRepository.findAndCount({
        where: whereCondition,
        skip,
        take: limit,
        relations: ['account'],
        order: {
          id: 'DESC',
        },
      });
      
      console.log(`Found ${restaurants.length} restaurants matching type "${type}"`);
      
      // Convert restaurants to DTOs
      const restaurantDtos = [];
      for (const restaurant of restaurants) {
        restaurantDtos.push({
          id: restaurant.id,
          account_id: restaurant.account?.id,
          name: restaurant.name,
          description: restaurant.description,
          address: restaurant.address,
          phone: restaurant.phone,
          image_url: restaurant.image_url,
          type: restaurant.type,
          email: restaurant.account?.email,
        });
      }

      return {
        content: restaurantDtos,
        number: page,
        size: limit,
        totalElements: total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error finding restaurants by type:', error);
      // Return empty result instead of throwing error for more resilient API
      return {
        content: [],
        number: page,
        size: limit,
        totalElements: 0,
        totalPages: 0,
      };
    }
  }

  /**
   * Helper: Get restaurant with account validation
   */
  private async _getRestaurantWithAccount(accountId: number): Promise<Restaurant> {
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

    return restaurant;
  }

  /**
   * Helper: Map restaurant to response DTO
   */
  private _mapToRestaurantResponseDto(
    restaurant: Restaurant,
    dishes: DishDto[],
  ): RestaurantResponseDto {
    return {
      id: restaurant.id,
      account_id: restaurant.account.id,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone: restaurant.phone,
      image_url: restaurant.image_url,
      type: restaurant.type,
      email: restaurant.account.email,
      dishes,
    };
  }
}