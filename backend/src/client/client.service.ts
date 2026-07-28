import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SoapService } from '../soap/soap.service';
import { CreateClientDto } from './dto/create-client.dto';
import { buildCreateClientXml, buildEditClientXml } from './client.templates';
import { UpdateClientDto } from './dto/update-client.dto';
// Import PrismaService của bạn (điều chỉnh lại đường dẫn relative cho đúng với thư mục thực tế)
import { PrismaService } from '../prisma/prisma.service';

interface CreateClientResult {
  NewClient: string;
  ApplicationNumber: string;
}

interface EditClientResult {
  RetCode: number;
  RetMsg: string;
  ResultInfo: string;
}

@Injectable()
export class ClientService {
  constructor(
    private readonly soap: SoapService,
    private readonly config: ConfigService,
    // Inject PrismaService vào đây thay vì TypeORM Repository
    private readonly prisma: PrismaService,
  ) {}

  getByParams(clientId: string) {
    return this.soap.call('GetClientByParmsV2', {
      ClientSearchMethod: 'CLIENT_ID',
      ClientIdentifier: clientId,
    });
  }

  async createClient(userId: number, dto: CreateClientDto) {
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';

    const clientNumber = dto.clientNumber ?? this.generateClientNumber();
    const dtoWithClientNumber = { ...dto, clientNumber };

    const xml = buildCreateClientXml(dtoWithClientNumber, officer);

    const way4Response = await this.soap.sendRaw<CreateClientResult>(
      'CreateClientV4',
      xml,
    );
    const newClientId = String(way4Response.NewClient ?? '');

    if (!newClientId) {
      throw new InternalServerErrorException(
        'Không lấy được Client ID từ WAY4',
      );
    }

    // Lưu cả 2 giá trị: clientId (WAY4 tự sinh) và clientNumber (tự sinh ở local)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        clientId: newClientId,
        clientNumber: clientNumber,
      },
    });

    return {
      success: true,
      clientId: newClientId,
      clientNumber: clientNumber,
    };
  }

  // Sinh ClientNumber duy nhất: timestamp (ms) + 3 số ngẫu nhiên, đảm bảo đủ dài và khó trùng
  private generateClientNumber(): string {
    const timestamp = Date.now().toString(); // 13 chữ số
    const random = Math.floor(100 + Math.random() * 900); // 3 chữ số ngẫu nhiên
    return `${timestamp}${random}`; // 16 chữ số
  }

  updateClient(clientId: string, dto: UpdateClientDto) {
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';
    const xml = buildEditClientXml(clientId, dto, officer);
    return this.soap.sendRaw<EditClientResult>('EditClientV6', xml);
  }
}
