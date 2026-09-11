import {
  Controller,
  Req,
  Get,
  Post,
  Body,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { type RequestWithUser } from '../common/interfaces/request-with-user.interface';

interface Way4SoapResponse {
  OutObject?: {
    IssClientDetailsV2APIRecord?: unknown;
  };
  IssClientDetailsV2APIRecord?: unknown;
  [key: string]: unknown;
}

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('me')
  async getProfile(@Req() req: RequestWithUser) {
    const user = req.user;

    if (!user || !user.clientId) {
      return { IssClientDetailsV2APIRecord: null, clientId: null };
    }

    const result = (await this.clientService.getByParams(
      user.clientId,
    )) as Way4SoapResponse;

    const clientRecord =
      result?.OutObject?.IssClientDetailsV2APIRecord ||
      result?.IssClientDetailsV2APIRecord ||
      result;

    return {
      IssClientDetailsV2APIRecord: clientRecord,
      clientId: user.clientId,
      clientNumber: user.clientNumber ?? null,
    };
  }

  @Post()
  create(@Req() req: RequestWithUser, @Body() dto: CreateClientDto) {
    const userId = req.user.userId;
    // API này dùng để tạo hồ sơ cho user đã tồn tại, nên sẽ gọi một hàm dành riêng cho nó
    return this.clientService.createClientForUser(userId, dto);
  }

  @Patch('me')
  update(@Req() req: RequestWithUser, @Body() dto: UpdateClientDto) {
    const clientId = req.user.clientId;
    if (!clientId) {
      throw new BadRequestException('Bạn chưa có hồ sơ khách hàng');
    }
    return this.clientService.updateClient(clientId, dto);
  }
}
