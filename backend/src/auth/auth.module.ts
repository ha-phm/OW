import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error(
    'JWT_SECRET và JWT_REFRESH_SECRET phải được cấu hình trong .env',
  );
}

@Module({
  imports: [
    PrismaModule, // để AuthService dùng được PrismaService
    PassportModule, // module có sẵn của thư viện passport, cần thiết để JwtStategy hoạt động
    JwtModule.register({
      // cung cấp JwtService (hàm signAsync dùng để tạo token)
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ], // import 3 cái này, AuthService dùng constructor(private prisma: PrismaService, private jwtService: JwtService) mà không bị lỗi thiếu provider.
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
