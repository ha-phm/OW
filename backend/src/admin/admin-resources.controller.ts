// admin-resources.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ContractService } from '../contract/contract.service'; // Import service
import { CardService } from '../card/card.service'; // Import service
import { GetAdminContractsQueryDto } from './dto/get-admin-contracts-query.dto';
import { GetAdminCardsQueryDto } from './dto/get-admin-cards-query.dto';

@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminResourcesController {
  constructor(
    private readonly contractService: ContractService,
    private readonly cardService: CardService,
  ) {}

  @Get('contracts')
  findAllContracts(@Query() query: GetAdminContractsQueryDto) {
    return this.contractService.listAllContracts(query);
  }

  @Get('cards')
  findAllCards(@Query() query: GetAdminCardsQueryDto) {
    return this.cardService.listAllCards(query);
  }
}
