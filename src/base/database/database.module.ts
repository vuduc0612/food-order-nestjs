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

// Lấy và log thông tin kết nối database trước khi cấu hình module
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;
const dbUsername = process.env.DB_USERNAME || 'root';
const dbPassword = process.env.DB_PASSWORD || '12345';
const dbName = process.env.DB_DATABASE || 'food';

console.log('Database connection parameters:');
console.log(`Host: ${dbHost}`);
console.log(`Port: ${dbPort}`);
console.log(`Username: ${dbUsername}`);
console.log(`Password: ${dbPassword ? '******' : 'not set'}`);
console.log(`Database: ${dbName}`);

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: dbHost,
      port: dbPort,
      username: dbUsername,
      password: dbPassword,
      database: dbName,
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
      ssl: process.env.DB_SSL === 'true',
    }),
  ],
})
export class DatabaseModule {}