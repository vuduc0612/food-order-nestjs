import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../account/entities/account.entities';
import { AccountRole } from '../account_role/entities/account_role.entity';
import { User } from '../user/entities/user.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { MailerProducer } from '../../queue/producers/mailer.producer';
import { AuthGuard } from './guard/auth.guard';
import { RolesGuard } from './guard/roles.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Account, AccountRole, User, Restaurant]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'mailer-queue',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailerProducer, AuthGuard, RolesGuard],
  exports: [AuthService, AuthGuard, RolesGuard],
})
export class AuthModule {}
