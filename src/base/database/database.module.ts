import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        return {
          type: 'mysql',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_POR, 10),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
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
          synchronize: process.env.NODE_ENV !== 'production',
          dropSchema: false,
          charset: 'utf8mb4',
          ssl: process.env.NODE_ENV === 'production',
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
