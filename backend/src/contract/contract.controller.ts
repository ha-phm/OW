import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import {
  ContractService,
  ContractResponse,
  FullCardApplicationResponse,
} from './contract.service';
import { CardService, CardContractResponse } from '../card/card.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateIssuingContractDto } from './dto/create-issuing-contract.dto';
import { CreateFullCardDto } from './dto/create-full-card.dto';
import { CreateCardDto } from '../card/dto/create-card.dto';

interface RequestWithUser {
  user: {
    userId: number;
    email: string;
    clientId?: string;
  };
}

@Controller('contracts')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    private readonly cardService: CardService, // thêm dependency này
  ) {}

  @Get('me')
  getMyContracts(@Request() req: RequestWithUser): Promise<unknown[]> {
    if (!req.user.clientId) {
      return Promise.resolve([]);
    }
    return this.contractService.getContractsByClientId(req.user.clientId);
  }

  @Get(':contractNumber')
  getContract(
    @Param('contractNumber') contractNumber: string,
  ): Promise<unknown> {
    return this.contractService.getContract(contractNumber);
  }

  // 1. Tạo riêng Liability Contract
  @Post()
  createContract(@Body() dto: CreateContractDto): Promise<ContractResponse> {
    return this.contractService.createContract(dto);
  }

  // 2. Tạo riêng Issuing Contract (Cần tự truyền liabContractNumber vào)
  @Post('issuing')
  createIssuingContract(
    @Body() dto: CreateIssuingContractDto,
  ): Promise<ContractResponse> {
    return this.contractService.createIssuingContract(dto);
  }

  // 3. Luồng kết hợp: frontend chỉ cần gọi API này là tự động ra cả 3 contract liên kết nhau
  @Post('full-application')
  createFullApplication(
    @Body() dto: CreateFullCardDto,
  ): Promise<FullCardApplicationResponse> {
    return this.contractService.createFullCardApplication(dto);
  }

  // 4. Sinh số thẻ từ Issuing Contract
  // -> Gọi thẳng CardService thay vì qua ContractService,
  //    vì logic tạo thẻ giờ đã chuyển hẳn về CardService.
  @Post('card')
  createCard(@Body() dto: CreateCardDto): Promise<CardContractResponse> {
    return this.cardService.createCardContract(dto);
  }
}
