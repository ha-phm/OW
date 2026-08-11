import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { SoapModule } from '../soap/soap.module';
import { ClientModule } from '../client/client.module';
import { CardModule } from '../card/card.module'; // Import CardModule để gọi hàm sinh thẻ

@Module({
  imports: [SoapModule, ClientModule, CardModule],
  controllers: [ContractController],
  providers: [ContractService],
})
export class ContractModule {}
