import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: Number(configService.get<number>('REDIS_PORT')),
          password: configService.get<string>('REDIS_PASSWORD'),
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
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Account]),
    DatabaseModule,
    AccountModule,
    AccountRoleModule,
    AuthModule,
    CategoryModule,
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
