import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './strategies/jwt.strategy';
import { User } from '@prisma/client';
import { ClientService } from '../client/client.service';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config/dist/config.service';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

type AuthUser = Pick<User, 'id' | 'email' | 'clientId' | 'clientNumber'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private clientService: ClientService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Kiểm tra sớm Email (Fail-fast)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email này đã được đăng ký!');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Tách phần hồ sơ (bỏ password) để chuẩn bị gửi cho WAY4
    const clientDto = { ...dto };
    delete (clientDto as { password?: string }).password;

    const MAX_RETRIES = 3;
    let attempts = 0;

    // VÒNG LẶP THỬ LẠI (RETRY MECHANISM)
    while (attempts < MAX_RETRIES) {
      try {
        // B1: Sinh mã khách hàng nội bộ
        const timestamp = Date.now().toString();
        const random = crypto.randomInt(100, 1000).toString();
        const clientNumber = `${timestamp}${random}`;

        // B2: GỌI HỆ THỐNG WAY4 TRƯỚC (Rủi ro cao nhất)
        // Lưu ý: Lát nữa ta sẽ sửa lại hàm này bên ClientService để nó KHÔNG động vào DB nữa
        const way4Payload = { ...clientDto, clientNumber };
        const clientResult =
          await this.clientService.createClientWay4Only(way4Payload);

        // B3: LƯU DATABASE NỘI BỘ (Khi WAY4 đã xác nhận thành công)
        const newUser = await this.prisma.user.create({
          data: {
            email: dto.email,
            password: hashedPassword,
            clientNumber: clientNumber,
            clientId: clientResult.clientId, // Lưu ID thực tế WAY4 trả về
          },
        });

        return {
          message: 'Tạo tài khoản và hồ sơ thành công!',
          email: newUser.email,
          clientId: newUser.clientId,
        };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (
            error.code === 'P2002' &&
            String(error.meta?.target).includes('clientNumber')
          ) {
            attempts++;
            continue;
          }
        }
        throw error;
      }
    }

    throw new InternalServerErrorException(
      'Hệ thống đang bận, không thể tạo mã khách hàng lúc này.',
    );
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
          secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
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
        secret: this.config.get<string>('JWT_SECRET')!,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
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
