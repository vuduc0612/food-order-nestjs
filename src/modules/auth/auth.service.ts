import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { MoreThanOrEqual, Repository } from 'typeorm';
  import * as argon2 from 'argon2';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import { InjectRepository } from '@nestjs/typeorm';
  import { MailerProducer } from 'src/queue/producers/mailer.producer';
  import { Account } from '../account/entities/account.entities';
  import { AccountRole } from '../account_role/entities/account_role.entity';
  import {
    ForgotPasswordDto,
    LoginDto,
    RegisterDto,
    ResetPasswordDto,
    VerifyOtpDto,
    UserRole,
  } from './auth.dto';
  
  @Injectable()
  export class AuthService {
    private otpStore = new Map<string, { otp: string; expiresAt: number }>();
  
    constructor(
      @InjectRepository(Account)
      private readonly accountRepository: Repository<Account>,
      @InjectRepository(AccountRole)
      private readonly accountRoleRepository: Repository<AccountRole>,
      private config: ConfigService,
      private jwt: JwtService,
      private readonly mailerProducer: MailerProducer,
    ) {}

    async register(dto: RegisterDto) {
      const existingAccount = await this.accountRepository.findOne({
        where: { email: dto.email },
      });
  
      if (existingAccount) {
        throw new ForbiddenException(
          'Email đã đăng ký! Vui lòng dùng email khác.',
        );
      }

      // Lấy role dựa trên code
      const roleCode = dto.role === UserRole.CUSTOMER ? 'CUSTOMER' : 'RESTAURANT';
      const role = await this.accountRoleRepository.findOne({
        where: { code: roleCode }
      });

      if (!role) {
        throw new BadRequestException('Role không tồn tại!');
      }
  
      const hash = await argon2.hash(dto.password);
  
      const newAccount = this.accountRepository.create({
        username: dto.name,
        email: dto.email,
        password: hash,
        role_id: role.id,
        created_at: new Date(),
      });
  
      await this.accountRepository.save(newAccount);
  
      const data = {
        to: dto.email,
        subject: 'Register',
        text: 'Bạn đã đăng ký thành công',
      };
      await this.mailerProducer.sendMail(data);
      return this.generateTokens(newAccount.id, newAccount.email, newAccount.role_id);
    }
  
    async login(dto: LoginDto, response: any) {
      const account = await this.accountRepository.findOne({
        where: { email: dto.email },
        relations: ['role']
      });
  
      if (!account) {
        throw new ForbiddenException(
          'Sai tài khoản hoặc mật khẩu! Vui lòng đăng nhập lại.',
        );
      }
  
      const pwMatch = await argon2.verify(account.password, dto.password);
  
      if (!pwMatch) {
        throw new ForbiddenException(
          'Sai tài khoản hoặc mật khẩu! Vui lòng đăng nhập lại.',
        );
      }

      // Kiểm tra role
      const roleCode = dto.role === UserRole.CUSTOMER ? 'CUSTOMER' : 'RESTAURANT';
      if (account.role.code !== roleCode) {
        throw new ForbiddenException(
          'Tài khoản này không có quyền đăng nhập với vai trò này!',
        );
      }
  
      const tokens = await this.generateTokens(account.id, account.email, account.role_id);
  
      response.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: this.config.get('NODE_ENV') === 'production',
        sameSite: 'strict',
      });
  
      return {
        message: 'Đăng nhập thành công',
        access_token: tokens.access_token,
        account: { 
          id: account.id, 
          username: account.username, 
          email: account.email, 
          role: account.role.code 
        },
      };
    }
  
    async generateTokens(
      accountId: number,
      email: string,
      roleId: number,
    ): Promise<{ access_token: string; refresh_token: string }> {
      const payload = { sub: accountId, email, role: roleId };
      const secret = this.config.get('JWT_SECRET');
  
      const access_token = await this.jwt.signAsync(payload, {
        expiresIn: '7d',
        secret,
      });
  
      const refresh_token = await this.jwt.signAsync(
        { sub: accountId, role: roleId },
        { expiresIn: '7d', secret },
      );
  
      return { access_token, refresh_token };
    }
  
    async logout(response: any) {
      response.clearCookie('refresh_token', {
        httpOnly: true,
        secure: this.config.get('NODE_ENV') === 'production',
      });
  
      response.status(200).json({ message: 'Đăng xuất thành công' });
    }
  
    async forgotPassword(dto: ForgotPasswordDto) {
      const account = await this.accountRepository.findOne({
        where: { email: dto.email },
      });
      if (!account) {
        throw new NotFoundException('Email không tồn tại trong hệ thống!');
      }
  
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;
  
      this.otpStore.set(dto.email, { otp, expiresAt });
  
      await this.mailerProducer.sendMail({
        to: dto.email,
        subject: 'Mã OTP đặt lại mật khẩu',
        text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 5 phút.`,
      });
  
      return { message: 'OTP đã được gửi qua email' };
    }

    async verifyOtp(dto: VerifyOtpDto) {
      const otpData = this.otpStore.get(dto.email);
      if (!otpData || otpData.otp !== dto.otp || otpData.expiresAt < Date.now()) {
        throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn!');
      }
      return { message: 'OTP hợp lệ' };
    }
  
    async resetPassword(dto: ResetPasswordDto) {
      const otpData = this.otpStore.get(dto.email);
      if (!otpData || otpData.otp !== dto.otp || otpData.expiresAt < Date.now()) {
        throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn!');
      }
  
      const account = await this.accountRepository.findOne({
        where: { email: dto.email },
      });
      if (!account) {
        throw new NotFoundException('Email không tồn tại trong hệ thống!');
      }
  
      account.password = await argon2.hash(dto.newPassword);
      await this.accountRepository.save(account);
      this.otpStore.delete(dto.email);
  
      return { message: 'Mật khẩu đã được đặt lại thành công' };
    }
  }
  