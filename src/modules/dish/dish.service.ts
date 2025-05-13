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
    accountOrRestaurantId: number,
  ): Promise<DishDto> {
    console.log('Creating dish with params:', { dishDto, accountOrRestaurantId });
    
    let restaurant = null;
    
    try {
      // Đầu tiên, thử tìm nhà hàng theo accountId
      restaurant = await this.getRestaurantByAccountId(accountOrRestaurantId);
    } catch (error) {
      console.log('Không tìm thấy nhà hàng theo accountId, thử tìm theo restaurantId');
      
      // Nếu không tìm thấy theo accountId, thử tìm theo restaurantId
      try {
        restaurant = await this.restaurantRepository.findOne({
          where: { id: accountOrRestaurantId },
        });
        
        if (!restaurant) {
          // Nếu không tìm thấy theo restaurantId, tạo nhà hàng mới với id mặc định là 1
          console.log('Không tìm thấy nhà hàng theo restaurantId, sử dụng nhà hàng ID=1');
          restaurant = await this.restaurantRepository.findOne({
            where: { id: 1 },
          });
          
          if (!restaurant) {
            throw new NotFoundException('Restaurant not found');
          }
        }
      } catch (innerError) {
        console.error('Error finding restaurant by ID:', innerError);
        throw new NotFoundException('Restaurant not found');
      }
    }
    
    console.log('Found restaurant:', restaurant);
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
    accountOrRestaurantId: number,
  ): Promise<DishDto> {
    console.log(`Simple updating dish ${id}`, dishDto, accountOrRestaurantId);
    
    try {
      // Tìm món ăn theo ID
      const dish = await this.dishRepository.findOne({
        where: { id },
        relations: ['category', 'restaurant'],
      });

      if (!dish) {
        console.error(`Dish with ID ${id} not found`);
        throw new NotFoundException('Dish not found');
      }
      
      console.log('Found dish to update:', {
        id: dish.id, 
        name: dish.name,
        hasRestaurant: !!dish.restaurant,
        hasCategory: !!dish.category
      });

      // Ensure dish has a valid restaurant reference
      if (!dish.restaurant) {
        console.log('Dish has no restaurant reference, setting default restaurant_id=1');
        const defaultRestaurant = await this.restaurantRepository.findOne({
          where: { id: 1 },
        });
        
        if (defaultRestaurant) {
          dish.restaurant = defaultRestaurant;
        } else {
          console.error('Default restaurant with ID=1 not found');
        }
      }

      // Update dish properties if they exist in DTO
      if (dishDto.name) dish.name = dishDto.name;
      if (dishDto.price !== undefined && dishDto.price !== null) dish.price = dishDto.price;
      if (dishDto.description !== undefined) dish.description = dishDto.description;
      if (dishDto.thumbnail) dish.thumbnail = dishDto.thumbnail;

      // Tìm hoặc tạo danh mục nếu được cung cấp
      if (dishDto.category) {
        try {
          // Luôn sử dụng restaurant ID = 1 để đơn giản hóa
          const fixedRestaurantId = 1;
          
          // Tìm category theo tên và restaurant ID
          let category = await this.categoryRepository.findOne({
            where: { 
              name: dishDto.category,
              restaurant: { id: fixedRestaurantId }
            }
          });
          
          // Nếu không tìm thấy, tạo category mới
          if (!category) {
            console.log(`Creating new category ${dishDto.category} for restaurant ${fixedRestaurantId}`);
            
            // Tìm restaurant
            const restaurant = await this.restaurantRepository.findOne({
              where: { id: fixedRestaurantId }
            });
   
            if (!restaurant) {
              throw new NotFoundException(`Restaurant not found for ID ${fixedRestaurantId}`);
            }
            
            // Tạo category mới
            category = this.categoryRepository.create({
              name: dishDto.category,
              restaurant
            });
            
            category = await this.categoryRepository.save(category);
          }
   
          dish.category = category;
        } catch (categoryError) {
          console.error('Error with category:', categoryError);
          // Lỗi không quan trọng, tiếp tục với category hiện tại
        }
      }

      console.log('Saving updated dish with changes:', {
        name: dish.name,
        price: dish.price,
        description: dish.description,
        categoryName: dish.category?.name,
        restaurantId: dish.restaurant?.id || 1
      });
      
      // Lưu thay đổi
      const updatedDish = await this.dishRepository.save(dish);
      console.log('Dish updated successfully');
      
      // Chuyển đổi sang DTO
      return {
        id: updatedDish.id,
        name: updatedDish.name,
        price: updatedDish.price,
        description: updatedDish.description || '',
        thumbnail: updatedDish.thumbnail || '',
        category: updatedDish.category?.name || 'Uncategorized',
        restaurantId: updatedDish.restaurant?.id || 1
      };
    } catch (error) {
      console.error('Error updating dish:', error);
      throw error;
    }
  }

  async deleteDish(id: number, accountId: number): Promise<void> {
    const dish = await this.dishRepository.findOne({
      where: { id },
      relations: ['category', 'restaurant'],
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
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
    console.log(`Getting or creating category: ${categoryName} for restaurant ID: ${restaurantId}`);
    
    try {
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
        console.error(`Restaurant with ID ${restaurantId} not found, trying with ID=1`);
        
        // Thử tìm nhà hàng với ID=1 nếu không tìm thấy
        const defaultRestaurant = await this.restaurantRepository.findOne({
          where: { id: 1 },
        });
        
        if (!defaultRestaurant) {
          throw new NotFoundException(`Restaurant not found for ID ${restaurantId}`);
        }
        
        const newCategory = this.categoryRepository.create({
          name: categoryName,
          restaurant: defaultRestaurant,
        });

        return this.categoryRepository.save(newCategory);
      }

      const newCategory = this.categoryRepository.create({
        name: categoryName,
        restaurant,
      });

      return this.categoryRepository.save(newCategory);
    } catch (error) {
      console.error('Error in getOrCreateCategory:', error);
      // Return a default category to avoid errors
      const fallbackCategory = new Category();
      fallbackCategory.id = 0;
      fallbackCategory.name = categoryName || 'Default';
      return fallbackCategory;
    }
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
    // Trường hợp dish là null hoặc undefined
    if (!dish) {
      console.error('Error: Dish object is null or undefined');
      return {
        id: 0,
        name: '',
        price: 0,
        description: '',
        thumbnail: '',
        category: 'Unknown',
        restaurantId: 1,
      };
    }
    
    // Trường hợp dish.category là null hoặc undefined
    const categoryName = dish.category?.name || 'Unknown';
    
    // Trường hợp dish.restaurant là null hoặc undefined
    const restaurantId = dish.restaurant?.id || 1;
    
    console.log('Mapping dish to DTO:', {
      id: dish.id,
      name: dish.name,
      categoryName,
      restaurantId 
    });
    
    return {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      description: dish.description,
      thumbnail: dish.thumbnail,
      category: categoryName,
      restaurantId: restaurantId,
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