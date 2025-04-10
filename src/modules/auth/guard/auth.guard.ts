import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import { Account } from 'src/modules/account/entities/account.entities';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private config: ConfigService,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bạn chưa đăng nhập!');
    }

    const token = authHeader.split(' ')[1].trim();

    try {
      const decoded = jwt.verify(token, this.config.get('JWT_SECRET')) as any;

      const account = await this.accountRepository.findOne({
        where: { email: decoded.email },
        relations: ['roles'],
      });

      if (!account) {
        throw new UnauthorizedException('Tài khoản không tồn tại');
      }

      request.user = {
        id: account.id,
        email: account.email,
        roles: account.roles.map((r) => r.roleType),
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }
}
