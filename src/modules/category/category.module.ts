import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { AccountModule } from '../account/account.module';
import { Account } from '../account/entities/account.entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Restaurant, Account]),
    AuthModule,
    forwardRef(() => RestaurantModule),
    AccountModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}