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

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('me')
  async getProfile(@Request() req: RequestWithUser): Promise<any> {
    const user = req.user;

    if (!user || !user.clientId) {
      return { IssClientDetailsV2APIRecord: null, clientId: null };
    }
    const result = (await this.clientService.getByParams(
      user.clientId,
    )) as Record<string, any>;
    return {
      ...result,
      clientId: user.clientId,
      clientNumber: user.clientNumber ?? null,
    };
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<any> {
    return this.clientService.getByParams(id);
  }

  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() dto: CreateClientDto,
  ): Promise<any> {
    const userId = req.user.userId;
    return this.clientService.createClient(userId, dto);
  }

  @Patch(':clientId')
  update(
    @Param('clientId') clientId: string,
    @Body() dto: UpdateClientDto,
  ): Promise<any> {
    return this.clientService.updateClient(clientId, dto);
  }
}
