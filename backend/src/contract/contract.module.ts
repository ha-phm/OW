import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { SoapModule } from '../soap/soap.module';
import { ClientModule } from '../client/client.module';
import { CardModule } from '../card/card.module';
import { ContractWay4Service } from './contract-way4.service';
import { ContractTreeService } from './contract-tree.service';
import { QuickOpenCardWorkflow } from './use-cases/quick-open-card.workflow';

@Module({
  imports: [SoapModule, ClientModule, CardModule],
  controllers: [ContractController],
  providers: [
    ContractService,
    ContractWay4Service,
    ContractTreeService,
    QuickOpenCardWorkflow,
  ],
  exports: [ContractService, QuickOpenCardWorkflow],
})
export class ContractModule {}
