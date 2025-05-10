import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from '../order_detail/entities/order_detail.entity';
import { CartModule } from '../cart/cart.module';
import { User } from '../user/entities/user.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { Dish } from '../dish/entities/dish.entity';
import { DishModule } from '../dish/dish.module';
import { UserModule } from '../user/user.module';
import { Account } from '../account/entities/account.entities';
import { AccountModule } from '../account/account.module';
import { RestaurantModule } from '../restaurant/restaurant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderDetail, User, Restaurant, Dish, Account]),
    CartModule,
    DishModule,
    UserModule,
    AccountModule,
    RestaurantModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
