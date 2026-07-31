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

type AuthUser = Pick<User, 'id' | 'email' | 'clientId' | 'clientNumber'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, pass: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email này đã được đăng ký!');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
      },
    });

    return {
      message: 'Tạo tài khoản thành công!',
      email: newUser.email,
    };
  }

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
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

      const isRefreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken as string,
      );
      if (!isRefreshTokenMatches) {
        throw new UnauthorizedException('Refresh token không hợp lệ.');
      }

      return this.issueTokens(user);
    } catch {
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

  /* đóng gói payload */
  private buildPayload(user: AuthUser): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      clientId: user.clientId,
      clientNumber: user.clientNumber,
    };
  }

  /** Sinh cặp access/refresh token mới và lưu refresh token (đã hash) vào DB */
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
