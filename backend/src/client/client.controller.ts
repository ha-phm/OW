import {
  Controller,
  Request,
  Get,
  Post,
  Body,
  Param,
  Patch,
  // Thêm UseGuards nếu bạn chưa áp dụng Global Guard
  // UseGuards,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Import Guard của bạn (nếu có)

interface RequestWithUser {
  user: {
    userId: number;
    email: string;
    clientId?: string;
    clientNumber?: string | null;
  };
}

@Controller('clients')
// @UseGuards(JwtAuthGuard) // Bỏ comment dòng này nếu bạn dùng Guard cho toàn bộ Controller
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('me')
  async getProfile(@Request() req: RequestWithUser): Promise<any> {
    const user = req.user;

    // Kiểm tra an toàn nếu user chưa đăng nhập hoặc chưa có clientId
    if (!user || !user.clientId) {
      return { IssClientDetailsV2APIRecord: null, clientId: null };
    }

    const result = (await this.clientService.getByParams(
      user.clientId,
    )) as Record<string, any>;

    // Tuỳ thuộc vào cách soap.service bóc tách XML,
    // ta tìm đúng Object chứa thông tin để trả về Frontend
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
