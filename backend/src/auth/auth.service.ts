import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 1. Hàm tạo tài khoản (Dùng để test)
  async register(email: string, pass: string, clientId?: string) {
    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email này đã được đăng ký!');
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(pass, 10);

    // Lưu vào bảng User đúng với các trường trong schema
    const newUser = await this.prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        clientId: clientId || null, // Nếu không truyền clientId thì để null
      },
    });

    return {
      message: 'Tạo tài khoản thành công!',
      email: newUser.email,
    };
  }

  // 2. Hàm đăng nhập
  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Sai mật khẩu');
    }

    // Tạo payload. user.id bây giờ là số (Int), user.clientId có thể null
    const payload = {
      email: user.email,
      sub: user.id,
      clientId: user.clientId,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
