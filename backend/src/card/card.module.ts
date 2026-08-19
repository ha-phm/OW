import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { SoapModule } from '../soap/soap.module';
import { ClientModule } from '../client/client.module';
import { CardWay4Service } from './card-way4.service';

@Module({
  imports: [SoapModule, ClientModule],
  controllers: [CardController],
  providers: [CardService, CardWay4Service],
  exports: [CardService], // ContractModule vẫn inject CardService.createCardContract
})
export class CardModule {}
