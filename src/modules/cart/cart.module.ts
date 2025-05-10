import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { CartController } from './cart.controller';
import { AccountModule } from '../account/account.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../account/entities/account.entities';

@Module({
  imports: [
    AccountModule,
    TypeOrmModule.forFeature([Account]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Kết nối Redis trực tiếp
        const redisClient = createClient({
          url: `redis://:${configService.get('REDIS_PASSWORD')}@${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
          legacyMode: true, // Sử dụng chế độ legacy để tương thích với cache-manager
        });

        // Kết nối đến Redis
        await redisClient.connect().catch(err => {
          console.error('Redis connection error:', err);
        });

        return {
          store: {
            create: () => ({
              get: async (key) => {
                const value = await redisClient.get(key);
                return value ? JSON.parse(value) : null;
              },
              set: async (key, value, ttl) => {
                const serializedValue = JSON.stringify(value);
                if (ttl) {
                  await redisClient.setEx(key, ttl, serializedValue);
                } else {
                  await redisClient.set(key, serializedValue);
                }
                return value;
              },
              del: async (key) => {
                await redisClient.del(key);
                return undefined;
              },
              reset: async () => {
                await redisClient.flushDb();
                return undefined;
              },
            }),
          },
          ttl: 60 * 60 * 24 * 7, // 7 ngày
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {} 