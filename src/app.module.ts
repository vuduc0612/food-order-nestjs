import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './base/database/database.module';
import { BullModule } from '@nestjs/bull';
import { AccountModule } from './modules/account/account.module';
import { AccountRoleModule } from './modules/account_role/account_role.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/category/category.module';
import { DishModule } from './modules/dish/dish.module';
import { OrderModule } from './modules/order/order.module';
import { OrderDetailModule } from './modules/order_detail/order_detail.module';
import { RestaurantModule } from './modules/restaurant/restaurant.module';
import { UserModule } from './modules/user/user.module';
import { QueueModule } from './queue/queue.module';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthGuard } from './modules/auth/guard/auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './modules/account/entities/account.entities';
import { CartModule } from './modules/cart/cart.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT, 10) || 6379,
          },
          password: process.env.REDIS_PASSWORD || undefined,
          ttl: 60 * 60 * 24 * 7, // 7 days
        });

        return {
          store: store,
        };
      },
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      },
    }),
    TypeOrmModule.forFeature([Account]),
    DatabaseModule,
    AccountModule,
    AccountRoleModule,
    AuthModule,
    CategoryModule,
    CartModule,
    DishModule,
    OrderModule,
    OrderDetailModule,
    RestaurantModule,
    UserModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    Reflector,
  ],
})
export class AppModule {}