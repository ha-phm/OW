import {
  Controller,
  Request,
  Get,
  Post,
  Body,
  Param,
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
  // Bỏ Promise<any> và để TypeScript tự nội suy (infer) kiểu trả về
  async getProfile(@Request() req: RequestWithUser) {
    const user = req.user;

    // Kiểm tra an toàn nếu user chưa đăng nhập hoặc chưa có clientId
    if (!user || !user.clientId) {
      return { IssClientDetailsV2APIRecord: null, clientId: null };
    }

    // Ép kiểu về Way4SoapResponse thay vì Record<string, any>
    const result = (await this.clientService.getByParams(
      user.clientId,
    )) as Way4SoapResponse;

    // Tuỳ thuộc vào cách soap.service bóc tách XML
    const clientRecord =
      result?.OutObject?.IssClientDetailsV2APIRecord ||
      result?.IssClientDetailsV2APIRecord ||
      result;

    return {
      // Đảm bảo trả ra đúng key mà màn hình CustomerProfilePage đang expect
      IssClientDetailsV2APIRecord: clientRecord,
      clientId: user.clientId,
      clientNumber: user.clientNumber ?? null,
    };
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.clientService.getByParams(id);
  }

  @Post()
  create(@Request() req: RequestWithUser, @Body() dto: CreateClientDto) {
    const userId = req.user.userId;
    return this.clientService.createClient(userId, dto);
  }

  @Patch(':clientId')
  update(@Param('clientId') clientId: string, @Body() dto: UpdateClientDto) {
    return this.clientService.updateClient(clientId, dto);
  }
}
