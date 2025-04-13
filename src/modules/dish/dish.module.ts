import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dish } from './entities/dish.entity';
import { Category } from '../category/entities/category.entity';
import { DishService } from './dish.service';
import { DishController } from './dish.controller';
import { CategoryModule } from '../category/category.module';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { AccountModule } from '../account/account.module';
import { Account } from '../account/entities/account.entities';
import { CloudinaryModule } from '../../base/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dish, Category, Restaurant, Account]),
    forwardRef(() => CategoryModule),
    forwardRef(() => RestaurantModule),
    AccountModule,
    CloudinaryModule,
  ],
  controllers: [DishController],
  providers: [DishService],
  exports: [DishService],
})
export class DishModule {}
