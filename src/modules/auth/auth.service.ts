import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerProducer } from 'src/queue/producers/mailer.producer';
import { Account } from '../account/entities/account.entities';
import { AccountRole } from '../account_role/entities/account_role.entity';
import { User } from '../user/entities/user.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { RoleType } from '../account_role/enums/role-type.enum';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './auth.dto';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(AccountRole)
    private readonly accountRoleRepository: Repository<AccountRole>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    private config: ConfigService,
    private jwt: JwtService,
    private readonly mailerProducer: MailerProducer,
  ) {}

  async register(dto: RegisterDto) {
    console.log('Type of role:', typeof dto.role);
    // Kiểm tra xem tài khoản đã tồn tại chưa
    const existingAccount = await this.accountRepository.findOne({
      where: { email: dto.email },
      relations: ['roles'],
    });
    const roleCode = dto.role as RoleType;

    // Nếu tài khoản đã tồn tại
    if (existingAccount) {
      const hasRole = existingAccount.roles?.some(
        (r) => r.roleType === roleCode,
      );

      if (hasRole) {
        throw new ForbiddenException(
          'Tài khoản đã có vai trò này. Vui lòng dùng email khác hoặc chọn vai trò khác.',
        );
      }

      // Nếu tài khoản chưa có role này thì thêm role
      const roleEntity = await this.accountRoleRepository.create({
        account: existingAccount,
        roleType: dto.role,
      });
      await this.accountRoleRepository.save(roleEntity);

      // Thêm bản ghi vào bảng tương ứng với role mới
      if (dto.role === RoleType.CUSTOMER) {
        const newUser = this.userRepository.create({
          account: existingAccount,
        });
        newUser.fullName = dto.name;
        await this.userRepository.save(newUser);
      } else if (dto.role === RoleType.RESTAURANT) {
        const newRestaurant = this.restaurantRepository.create({
          account: existingAccount,
        });
        newRestaurant.name = dto.name;
        await this.restaurantRepository.save(newRestaurant);
      }

      return {
        message: 'Tài khoản đã tồn tại, thêm vai trò thành công',
        status: 'success',
      };
    }

    // Nếu tài khoản chưa tồn tại
    const hashPassword = await argon2.hash(dto.password);
    const newAccount = this.accountRepository.create({
      email: dto.email,
      password: hashPassword,
    });
    const savedAccount = await this.accountRepository.save(newAccount);
    const roleEntity = await this.accountRoleRepository.create({
      account: savedAccount,
      roleType: dto.role,
    });
    await this.accountRoleRepository.save(roleEntity);

    if (dto.role === RoleType.CUSTOMER) {
      const newUser = this.userRepository.create({
        account: savedAccount,
      });
      newUser.fullName = dto.name;
      await this.userRepository.save(newUser);
    } else if (dto.role === RoleType.RESTAURANT) {
      const newRestaurant = this.restaurantRepository.create({
        account: savedAccount,
      });
      newRestaurant.name = dto.name;
      await this.restaurantRepository.save(newRestaurant);
    }

    const data = {
      to: dto.email,
      subject: 'Register',
      text: 'Bạn đã đăng ký thành công',
    };
    await this.mailerProducer.sendMail(data);
    // return this.generateTokens(
    //   savedAccount.id,
    //   savedAccount.email,
    //   savedAccount.roles.map((r) => r.roleType),
    // );
    return {
      message: 'Đăng ký thành công',
      status: 'success',
    };
  }

  async login(dto: LoginDto, response: any) {
    const account = await this.accountRepository.findOne({
      where: { email: dto.email },
      relations: ['roles'],
    });

    if (!account) {
      throw new NotFoundException('Email không tồn tại');
    }

    const isPasswordValid = await argon2.verify(account.password, dto.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu không đúng');
    }

    // Kiểm tra xem tài khoản có role mà người dùng đang cố gắng đăng nhập không
    const hasRequestedRole = account.roles.some(role => role.roleType === dto.role);
    if (!hasRequestedRole) {
      throw new ForbiddenException('Bạn không có quyền đăng nhập với vai trò này');
    }

    // Cập nhật thời gian đăng nhập cuối cùng
    account.last_login = new Date();
    await this.accountRepository.save(account);

    // Tạo token chỉ với role được chọn để đăng nhập
    const tokens = await this.generateTokens(
      account.id,
      account.email,
      dto.role,
    );

    response.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      access_token: tokens.access_token,
      message: 'Đăng nhập thành công',
    };
  }

  async generateTokens(
    id: number,
    email: string,
    role: RoleType,
  ): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const payload = {
      sub: id,
      email: email,
      role: role, // Sử dụng role được truyền vào
    };

    const secret = this.config.get('JWT_SECRET');

    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret,
    });

    const refresh_token = await this.jwt.signAsync(
      { sub: id },
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
