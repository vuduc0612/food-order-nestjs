import { Module, forwardRef } from '@nestjs/common';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { AuthModule } from '../auth/auth.module';
import { Account } from '../account/entities/account.entities';
import { AccountModule } from '../account/account.module';
import { CloudinaryModule } from '../../base/cloudinary/cloudinary.module';
import { DishModule } from '../dish/dish.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, Account]),
    AuthModule,
    AccountModule,
    CloudinaryModule,
    forwardRef(() => DishModule),
    forwardRef(() => CategoryModule),
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService],
})
export class RestaurantModule {}