import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { GetAdminContractsQueryDto } from './dto/get-admin-contracts-query.dto';
import { GetAdminCardsQueryDto } from './dto/get-admin-cards-query.dto';

// Tách controller riêng vì AdminController hiện có đang khai báo
// @Controller('admin/users') — không thể gắn thêm route 'contracts'/'cards'
// vào đúng prefix '/admin' trên cùng controller đó.
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminResourcesController {
  constructor(private readonly adminService: AdminService) {}

  @Get('contracts')
  findAllContracts(@Query() query: GetAdminContractsQueryDto) {
    return this.adminService.listAllContracts(query);
  }

  @Get('cards')
  findAllCards(@Query() query: GetAdminCardsQueryDto) {
    return this.adminService.listAllCards(query);
  }
}
