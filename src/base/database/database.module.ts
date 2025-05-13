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
      useFactory: (config: ConfigService) => {
        return {
          type: 'mysql',
          host: config.getOrThrow('DB_HOST'),
          port: parseInt(config.getOrThrow('DB_PORT'), 10),
          username: config.getOrThrow('DB_USERNAME'),
          password: config.getOrThrow('DB_PASSWORD'),
          database: config.getOrThrow('DB_DATABASE'),
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
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}