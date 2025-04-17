import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DishModule } from '../dish/dish.module';
import { UserModule } from '../user/user.module';
import { Dish } from '../dish/entities/dish.entity';
import { User } from '../user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: 60 * 60 * 24 * 7, // 7 days default cache TTL
        max: 100, // maximum number of items in cache
      }),
    }),
    TypeOrmModule.forFeature([Dish, User]),
    DishModule, // Import DishModule để sử dụng DishService
    UserModule, // Import UserModule để sử dụng UserService
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
