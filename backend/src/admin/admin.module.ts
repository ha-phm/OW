import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminResourcesController } from './admin-resources.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';
import { ContractModule } from '../contract/contract.module';
import { CardModule } from '../card/card.module';

@Module({
  imports: [PrismaModule, CardModule, ContractModule],
  controllers: [
    AdminController,
    AdminResourcesController,
    AdminStatsController,
  ],
  providers: [AdminService, AdminStatsService],
})
export class AdminModule {}
