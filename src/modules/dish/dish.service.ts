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

  async getPublicDishByCategory(
    categoryId: number,
    page: number,
    limit: number,
  ): Promise<PageDto<DishDto>> {
    // Kiểm tra nếu danh mục tồn tại
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Lấy tất cả các món ăn trong danh mục này mà không cần kiểm tra nhà hàng
    return this.getPaginatedDishes({
      page,
      limit,
      where: {
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
      category: dish.category.name,
      restaurantId: dish.restaurant.id,
    };
  }

  // Phương thức tạo dữ liệu mẫu cho món ăn
  async seedFakeData(accountId: number): Promise<DishDto[]> {
    // Tìm nhà hàng dựa trên accountId
    console.log('restaurant id', accountId);
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant not found for account ID: ${accountId}`,
      );
    }

    // Tạo các danh mục mẫu
    const categories = [
      'Món chính',
      'Món khai vị',
      'Món tráng miệng',
      'Đồ uống',
      'Đặc sản',
    ];

    const savedCategories = [];

    for (const categoryName of categories) {
      let category = await this.categoryRepository.findOne({
        where: { name: categoryName, restaurant: { id: restaurant.id } },
      });

      if (!category) {
        const newCategory = this.categoryRepository.create({
          name: categoryName,
          restaurant: restaurant,
        });
        category = await this.categoryRepository.save(newCategory);
      }

      savedCategories.push(category);
    }

    // Dữ liệu các món ăn mẫu
    const fakeDishes = [
      {
        name: 'Phở bò đặc biệt',
        price: 75000,
        description:
          'Phở bò truyền thống với nước dùng ngọt thanh từ xương bò hầm nhiều giờ',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/pho-bo.jpg',
        category: savedCategories[0], // Món chính
      },
      {
        name: 'Bún chả Hà Nội',
        price: 65000,
        description:
          'Bún ăn kèm chả viên và chả miếng nướng thơm ngon, nước mắm chua ngọt đậm đà',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/bun-cha.jpg',
        category: savedCategories[0], // Món chính
      },
      {
        name: 'Gỏi cuốn tôm thịt',
        price: 45000,
        description: 'Gỏi cuốn với tôm tươi, thịt luộc, rau thơm và bún',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/goi-cuon.jpg',
        category: savedCategories[1], // Món khai vị
      },
      {
        name: 'Chả giò hải sản',
        price: 55000,
        description: 'Chả giò giòn rụm với nhân hải sản và rau củ',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/cha-gio.jpg',
        category: savedCategories[1], // Món khai vị
      },
      {
        name: 'Chè khúc bạch',
        price: 35000,
        description:
          'Chè khúc bạch mát lạnh với trái cây tươi và thạch rau câu',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/che-khuc-bach.jpg',
        category: savedCategories[2], // Món tráng miệng
      },
      {
        name: 'Bánh flan caramen',
        price: 25000,
        description: 'Bánh flan mềm mịn với lớp caramen ngọt đậm',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/banh-flan.jpg',
        category: savedCategories[2], // Món tráng miệng
      },
      {
        name: 'Nước ép cam tươi',
        price: 30000,
        description: 'Nước ép từ cam tươi nguyên chất, không đường',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/nuoc-cam.jpg',
        category: savedCategories[3], // Đồ uống
      },
      {
        name: 'Sinh tố bơ',
        price: 40000,
        description: 'Sinh tố bơ đặc sánh mịn với sữa tươi',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/sinh-to-bo.jpg',
        category: savedCategories[3], // Đồ uống
      },
      {
        name: 'Cơm niêu sườn chả',
        price: 85000,
        description: 'Cơm niêu thơm ngon với sườn nướng và chả trứng',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/com-nieu.jpg',
        category: savedCategories[4], // Đặc sản
      },
      {
        name: 'Lẩu thái hải sản',
        price: 250000,
        description:
          'Lẩu thái chua cay với hải sản tươi ngon, phục vụ 2-3 người',
        thumbnail:
          'https://res.cloudinary.com/dospciqhb/image/upload/v1710066371/lau-thai.jpg',
        category: savedCategories[4], // Đặc sản
      },
    ];

    const savedDishes = [];

    // Lưu các món ăn vào database
    for (const fakeDish of fakeDishes) {
      const dish = this.dishRepository.create({
        name: fakeDish.name,
        price: fakeDish.price,
        description: fakeDish.description,
        thumbnail: fakeDish.thumbnail,
        restaurant: restaurant,
        category: fakeDish.category,
      });

      const savedDish = await this.dishRepository.save(dish);
      savedDishes.push(this.mapToDishDto(savedDish));
    }

    return savedDishes;
  }
}
