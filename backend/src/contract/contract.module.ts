import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { SoapModule } from '../soap/soap.module';
import { ClientModule } from '../client/client.module';
import { CardModule } from '../card/card.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [SoapModule, ClientModule, CardModule, PrismaModule],
  controllers: [ContractController],
  providers: [ContractService],
})
export class ContractModule {}
