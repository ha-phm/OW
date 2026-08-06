import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core'; // Bắt buộc phải import APP_GUARD từ @nestjs/core
import { ConfigModule } from '@nestjs/config';
import { SoapModule } from './soap/soap.module';
import { ClientModule } from './client/client.module';
import { ContractModule } from './contract/contract.module';
import { PrismaModule } from './prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'; // Import Guard bạn đã tạo
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SoapModule,
    ClientModule,
    ContractModule,
    PrismaModule,
    PassportModule,
    AdminModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
