import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { SoapModule } from '../soap/soap.module';

@Module({
  imports: [SoapModule],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
