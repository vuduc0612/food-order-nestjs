import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../account/entities/account.entities';
import { AccountRole } from '../account_role/entities/account_role.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { MailerProducer } from 'src/queue/producers/mailer.producer';
import { AuthGuard } from './guard/auth.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Account, AccountRole]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    BullModule.registerQueue({
      name: 'mailer-queue',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailerProducer, AuthGuard],
})
export class AuthModule {}
