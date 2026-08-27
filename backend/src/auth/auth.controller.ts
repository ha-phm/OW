import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Get,
  Res,
  Req,
} from '@nestjs/common';
import type { Response, Request } from 'express'; // Bổ sung import này
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  me(
    @CurrentUser()
    user: {
      userId: number;
      email: string;
      role: string;
      clientId: string | null;
    },
  ) {
    return user;
  }

  @Public()
  @Post('signup')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.login(dto.email, dto.password);

    // Set Refresh Token vào HttpOnly Cookie
    response.cookie('refreshToken', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // True nếu chạy trên HTTPS
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    // Chỉ trả về Access Token cho Frontend
    return { accessToken: tokens.access_token };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshTokens(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Đọc Refresh Token từ Cookie thay vì từ Body
    const refreshToken = request.cookies?.refreshToken as string;

    if (!refreshToken) {
      throw new BadRequestException(
        'Không tìm thấy refresh token trong cookie',
      );
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Cập nhật lại Cookie với Refresh Token mới (Roll-over)
    response.cookie('refreshToken', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.access_token };
  }

  @Post('logout')
  async logout(
    @CurrentUser() user: { userId: number },
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(user.userId);

    // Xóa cookie khi đăng xuất
    response.clearCookie('refreshToken');

    return { message: 'Đăng xuất thành công' };
  }
}
