// nơi token thực sự đọc khi có request tới

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type JwtPayload = {
  sub: number;
  email: string;
  clientId: string | null;
  clientNumber: string | null;
};

export type AuthenticatedUser = {
  userId: number;
  email: string;
  clientId: string | null;
  clientNumber: string | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    return {
      userId: payload.sub,
      email: payload.email,
      clientId: user?.clientId ?? null,
      clientNumber: user?.clientNumber ?? null,
    };
  }
}
