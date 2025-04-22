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
    const skip = page * limit;
    const [dishes, total] = await this.dishRepository.findAndCount({
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

  async getAllDishByRestaurant(
    accountId: number,
    page: number,
    limit: number,
  ): Promise<PageDto<DishDto>> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant not found for account ID: ${accountId}`,
      );
    }

    const skip = page * limit;
    const [dishes, total] = await this.dishRepository.findAndCount({
      where: { restaurant: { id: restaurant.id } },
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

  async getAllDishByCategory(
    categoryId: number,
    accountId: number,
    page: number,
    limit: number,
  ): Promise<PageDto<DishDto>> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant not found for account ID: ${accountId}`,
      );
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
        category: { id: categoryId },
      },
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
    // Tìm restaurant dựa trên accountId thay vì restaurantId
    const restaurant = await this.restaurantRepository.findOne({
      where: { accountId: accountId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant not found for account ID: ${accountId}`,
      );
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

  async updateDish(
    id: number,
    dishDto: UpdateDishDto,
    accountId: number,
  ): Promise<DishDto> {
    const dish = await this.dishRepository.findOne({
      where: { id },
      relations: ['category', 'restaurant', 'restaurant.account'],
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    // Kiểm tra xem người dùng có quyền cập nhật món ăn này không
    if (dish.restaurant.accountId !== accountId) {
      throw new BadRequestException(
        'You do not have permission to update this dish',
      );
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
        where: {
          name: dishDto.category,
          restaurant: { id: dish.restaurant.id },
        },
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
      throw new BadRequestException(
        'You do not have permission to delete this dish',
      );
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
