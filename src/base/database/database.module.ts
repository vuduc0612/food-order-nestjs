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
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow('DB_HOST'),
        port: parseInt(configService.getOrThrow('DB_PORT'), 10),
        username: configService.getOrThrow('DB_USERNAME'),
        password: configService.getOrThrow('DB_PASSWORD'),
        database: configService.getOrThrow('DB_NAME'),
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
        charset: 'utf8mb4',
        ssl: false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
