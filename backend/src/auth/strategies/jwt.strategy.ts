// nơi token thực sự đọc khi có request tới
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config/dist/config.service';

export type JwtPayload = {
  sub: number;
  email: string;
  clientId: string | null;
  clientNumber: string | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        clientId: true,
        clientNumber: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không còn tồn tại');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      clientId: user?.clientId ?? null,
      clientNumber: user?.clientNumber ?? null,
      role: user.role,
    };
  }
}
