import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { AuthDto } from './dto/auth.dto'; // Import file DTO vừa tạo

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: AuthDto) {
    // Tạm thời truyền clientId là undefined/null ở bước đăng ký nội bộ
    return this.authService.register(dto.email, dto.password);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: AuthDto) {
    return this.authService.login(dto.email, dto.password);
  }
}
