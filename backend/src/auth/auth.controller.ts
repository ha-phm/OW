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
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
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

  @Post('logout')
  async logout(@CurrentUser() user: { userId: number }) {
    return this.authService.logout(user.userId);
  }
}
