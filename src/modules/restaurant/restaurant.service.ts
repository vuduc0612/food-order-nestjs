import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { UpdateRestaurantDto, RestaurantResponseDto, RestaurantDetailResponseDto } from './restaurant.dto';
import { DishService } from '../dish/dish.service';
import { DishDto } from '../dish/dish.dto';
import { CategoryService } from '../category/category.service';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @Inject(forwardRef(() => DishService))
    private readonly dishService: DishService,
    @Inject(forwardRef(() => CategoryService))
    private readonly categoryService: CategoryService,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Lấy danh sách nhà hàng với phân trang và tìm kiếm
   */
  async findAll(page: number = 0, size: number = 10, search?: string): Promise<{
    content: RestaurantResponseDto[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  }> {
    // Tính toán phân trang
    const skip = page * size;
    
    // Tạo query builder
    const queryBuilder = this.restaurantRepository.createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.account', 'account');
    
    // Thêm điều kiện tìm kiếm nếu có
    if (search) {
      queryBuilder.where(
        'restaurant.name LIKE :search OR restaurant.description LIKE :search OR restaurant.address LIKE :search',
        { search: `%${search}%` }
      );
    }
    
    // Lấy tổng số nhà hàng phù hợp với điều kiện
    const totalElements = await queryBuilder.getCount();
    
    // Thêm phân trang
    queryBuilder.skip(skip).take(size);
    
    // Thêm sắp xếp
    queryBuilder.orderBy('restaurant.id', 'DESC');
    
    // Thực hiện truy vấn
    const restaurants = await queryBuilder.getMany();
    
    // Tính tổng số trang
    const totalPages = Math.ceil(totalElements / size);
    
    // Chuyển đổi dữ liệu sang DTO
    const restaurantDtos = await Promise.all(
      restaurants.map(async (restaurant) => {
        // Lấy danh sách món ăn của nhà hàng
        const dishesPage = await this.dishService.getAllDishByRestaurant(
          restaurant.account.id,
          0,
          10 // Giới hạn 10 món ăn để tối ưu hiệu suất
        );
        
        // Lấy danh sách danh mục của nhà hàng
        const categories = await this.categoryRepository.find({
          where: { restaurant: { id: restaurant.id } },
        });
        
        // Chuyển đổi dữ liệu danh mục sang DTO
        const categoryDtos = categories.map(category => ({
          id: category.id,
          restaurant_id: restaurant.id,
          name: category.name,
        }));
        
        return {
          id: restaurant.id,
          account_id: restaurant.account.id,
          name: restaurant.name,
          description: restaurant.description,
          address: restaurant.address,
          phone: restaurant.phone,
          image_url: restaurant.image_url,
          email: restaurant.account.email,
          dishes: dishesPage.content,
          categories: categoryDtos,
        };
      })
    );
    
    // Trả về kết quả phân trang
    return {
      content: restaurantDtos,
      pageNumber: page,
      pageSize: size,
      totalElements,
      totalPages,
    };
  }

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

    // Lấy danh sách danh mục của nhà hàng
    const categories = await this.categoryRepository.find({
      where: { restaurant: { id: restaurant.id } },
    });
    
    // Chuyển đổi dữ liệu danh mục sang DTO
    const categoryDtos = categories.map(category => ({
      id: category.id,
      restaurant_id: restaurant.id,
      name: category.name,
    }));

    return {
      id: restaurant.id,
      account_id: restaurant.account.id,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone: restaurant.phone,
      image_url: restaurant.image_url,
      email: restaurant.account.email,
      dishes: dishesPage.content,
      categories: categoryDtos,
    };
  }

  async getRestaurantWithDishes(id: number): Promise<RestaurantResponseDto> {
    const restaurant = await this.findById(id);

    const dishesPage = await this.dishService.getAllDishByRestaurant(
      restaurant.account.id,
      0,
      100,
    );

    // Lấy danh sách danh mục của nhà hàng
    const categories = await this.categoryRepository.find({
      where: { restaurant: { id: restaurant.id } },
    });
    
    // Chuyển đổi dữ liệu danh mục sang DTO
    const categoryDtos = categories.map(category => ({
      id: category.id,
      restaurant_id: restaurant.id,
      name: category.name,
    }));

    return {
      id: restaurant.id,
      account_id: restaurant.account.id,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone: restaurant.phone,
      image_url: restaurant.image_url,
      email: restaurant.account.email,
      dishes: dishesPage.content,
      categories: categoryDtos,
    };
  }

  /**
   * Lấy chi tiết nhà hàng bao gồm thông tin nhà hàng, danh mục và món ăn
   */
  async getRestaurantDetail(id: number): Promise<RestaurantDetailResponseDto> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['account'],
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    // Lấy danh sách danh mục của nhà hàng
    const categories = await this.categoryRepository.find({
      where: { restaurant: { id: restaurant.id } },
    });

    // Lấy tất cả món ăn của nhà hàng
    const dishesPage = await this.dishService.getAllDishByRestaurant(
      restaurant.account.id,
      0,
      1000, // Lấy số lượng lớn để đảm bảo lấy tất cả
    );
    const allDishes = dishesPage.content;

    // Tạo cấu trúc danh mục kèm món ăn
    const categoriesWithDishes = await Promise.all(
      categories.map(async (category) => {
        // Lọc món ăn theo danh mục
        const dishes = allDishes.filter((dish) => {
          try {
            // Nếu dish.category không tồn tại
            if (dish.category === undefined || dish.category === null) {
              return false;
            }
            
            // Phân tích dựa trên kiểu dữ liệu
            if (typeof dish.category === 'object') {
              // Kiểm tra thêm một lần nữa để tránh lỗi null
              if (!dish.category || !('id' in dish.category)) {
                return false;
              }
              return dish.category === category.name;
            } else if (typeof dish.category === 'string') {
              return dish.category === category.name.toString();
            } else if (typeof dish.category === 'number') {
              return dish.category === category.name;
            }
            
            return false;
          } catch (error) {
            console.error(`Lỗi khi so sánh danh mục: ${error.message}`);
            return false;
          }
        });

        return {
          id: category.id,
          name: category.name,
          dishes: dishes,
        };
      }),
    );

    // Map thông tin nhà hàng kèm theo danh mục và món ăn
    return {
      id: restaurant.id,
      account_id: restaurant.account.id,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone: restaurant.phone,
      image_url: restaurant.image_url,
      email: restaurant.account.email,
      dishes: allDishes,
      categories: categories.map(category => ({
        id: category.id,
        restaurant_id: restaurant.id,
        name: category.name,
      })),
      categoriesWithDishes: categoriesWithDishes,
    };
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
      email: restaurant.account.email,
      dishes,
    };
  }
}
