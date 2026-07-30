import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body('email') email: string, @Body('password') pass: string) {
    if (!email || !pass) {
      throw new BadRequestException(
        'Vui lòng cung cấp đầy đủ email và password',
      );
    }
    return this.authService.register(email, pass);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body('email') email: string, @Body('password') pass: string) {
    if (!email || !pass) {
      throw new BadRequestException(
        'Vui lòng cung cấp đầy đủ email và password',
      );
    }
    return this.authService.login(email, pass);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshTokens(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException(
        'Không tìm thấy refresh_token trong body request',
      );
    }
    return this.authService.refreshTokens(refreshToken);
  }
}
