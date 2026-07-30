import {
  Controller,
  Request,
  Get,
  Post,
  Body,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

interface RequestWithUser {
  user: {
    userId: number;
    email: string;
    clientId?: string;
    clientNumber?: string | null;
  };
}

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
  async getProfile(@Request() req: RequestWithUser) {
    const user = req.user;

    if (!user || !user.clientId) {
      return { IssClientDetailsV2APIRecord: null, clientId: null };
    }

    // Ép kiểu về Way4SoapResponse thay vì Record<string, any>
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
  create(@Request() req: RequestWithUser, @Body() dto: CreateClientDto) {
    const userId = req.user.userId;
    return this.clientService.createClient(userId, dto);
  }

  @Patch('me')
  update(@Request() req: RequestWithUser, @Body() dto: UpdateClientDto) {
    const clientId = req.user.clientId;
    if (!clientId) {
      throw new BadRequestException('Bạn chưa có hồ sơ khách hàng');
    }
    return this.clientService.updateClient(clientId, dto);
  }
}
