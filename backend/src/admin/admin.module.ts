import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminResourcesController } from './admin-resources.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, AdminResourcesController],
  providers: [AdminService],
})
export class AdminModule {}
