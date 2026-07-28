import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { SoapModule } from '../soap/soap.module'; // Import đường dẫn theo project của bạn

@Module({
  imports: [SoapModule],
  controllers: [CardController],
  providers: [CardService],
  exports: [CardService], // Export để ContractService có thể gọi hàm createCardContract
})
export class CardModule {}
