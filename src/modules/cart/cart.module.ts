import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { DishModule } from '../dish/dish.module';
import { UserModule } from '../user/user.module';
import { Dish } from '../dish/entities/dish.entity';
import { User } from '../user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../account/entities/account.entities';

@Module({
  imports: [
    // Không cần cấu hình CacheModule riêng vì đã được cấu hình global trong AppModule
    TypeOrmModule.forFeature([Dish, User, Account]),
    DishModule,
    UserModule,
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
