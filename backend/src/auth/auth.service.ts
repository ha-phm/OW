import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './strategies/jwt.strategy';
import { User } from '@prisma/client';
import { ClientService } from '../client/client.service';
import { RegisterDto } from './dto/register.dto';

// 👈 THIẾU DÒNG NÀY trong bản trước — gây lỗi "Cannot find name 'AuthUser'"
type AuthUser = Pick<User, 'id' | 'email' | 'clientId' | 'clientNumber'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private clientService: ClientService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email này đã được đăng ký!');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // B1: tạo User trước, CHƯA có clientId
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
      },
    });

    // B2: tách phần hồ sơ (bỏ password) để gửi cho ClientService
    // 👈 dùng "..." rest thay vì destructure biến password không dùng tới,
    // tránh lỗi ESLint no-unused-vars
    const clientDto = { ...dto };
    delete (clientDto as { password?: string }).password;

    try {
      // B3: tạo hồ sơ bên OpenWay — hàm này tự update clientId/clientNumber vào User
      const clientResult = await this.clientService.createClient(
        newUser.id,
        clientDto,
      );

      return {
        message: 'Tạo tài khoản và hồ sơ thành công!',
        email: newUser.email,
        clientId: clientResult.clientId,
      };
    } catch (error) {
      // Nếu OpenWay lỗi, xoá User vừa tạo để tránh "tài khoản mồ côi" không có hồ sơ
      await this.prisma.user.delete({ where: { id: newUser.id } });
      throw error;
    }
  }

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    if (user.isActive === false) {
      throw new UnauthorizedException(
        'Tài khoản đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ Admin.',
      );
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Sai mật khẩu');
    }

    return this.issueTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );

      const user = await this.prisma.user.findUnique({
        where: { id: Number(decoded.sub) },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException(
          'Không thể xác thực. Vui lòng đăng nhập lại.',
        );
      }

      // Chặn refresh token nếu tài khoản đã bị khóa
      if (user.isActive === false) {
        throw new UnauthorizedException(
          'Tài khoản đã bị khóa. Phiên đăng nhập kết thúc.',
        );
      }

      const isRefreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenMatches) {
        throw new UnauthorizedException('Refresh token không hợp lệ.');
      }

      return this.issueTokens(user);
    } catch (error) {
      // Tốt nhất là throw lại đúng lỗi (hoặc ghi log) để dễ debug thay vì nuốt lỗi
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Refresh token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
      );
    }
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Đăng xuất thành công' };
  }

  private buildPayload(user: AuthUser): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      clientId: user.clientId,
      clientNumber: user.clientNumber,
    };
  }

  private async issueTokens(user: AuthUser) {
    const tokens = await this.generateTokens(this.buildPayload(user));
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }
}
