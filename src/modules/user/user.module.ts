import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { Account } from '../account/entities/account.entities';
import { CloudinaryModule } from 'src/base/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account]),
    AuthModule,
    CloudinaryModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
