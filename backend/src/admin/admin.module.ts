import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminResourcesController } from './admin-resources.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminController,
    AdminResourcesController,
    AdminStatsController,
  ],
  providers: [AdminService, AdminStatsService],
})
export class AdminModule {}
