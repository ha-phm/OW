import { Module } from '@nestjs/common';
import { SoapService } from './soap.service';

@Module({
  providers: [SoapService],
  exports: [SoapService], // export ra để module khác import dùng được
})
export class SoapModule {}
