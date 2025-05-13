import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/modules/account/entities/account.entities';
import { AccountRole } from 'src/modules/account_role/entities/account_role.entity';
import { Category } from 'src/modules/category/entities/category.entity';
import { Dish } from 'src/modules/dish/entities/dish.entity';
import { Order } from 'src/modules/order/entities/order.entity';
import { OrderDetail } from 'src/modules/order_detail/entities/order_detail.entity';
import { Restaurant } from 'src/modules/restaurant/entities/restaurant.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '123456',
      database: 'food_order_db',
      entities: [
        User,
        Order,
        Account,
        AccountRole,
        Category,
        Dish,
        OrderDetail,
        Restaurant,
      ],
      synchronize: true,
      dropSchema: false,
      charset: 'utf8mb4',
      ssl: false,
    }),
  ],
})
export class DatabaseModule {}