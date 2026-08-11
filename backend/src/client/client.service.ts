import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SoapService } from '../soap/soap.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildCreateClientXml,
  buildEditClientXml,
  buildGetClientXml,
} from './client.templates';

interface CreateClientResult {
  NewClient: string;
  ApplicationNumber: string;
  RetCode: string | number;
  RetMsg: string;
  ResultInfo: string;
}

interface EditClientResult {
  RetCode: string | number;
  RetMsg: string;
  ResultInfo: string;
}

// Kiểu dữ liệu của GetClientByParmsV2 — record chi tiết khách hàng trả về
// từ WAY4. Đây là "nguồn sự thật" duy nhất; mọi nơi gọi getByParams() sẽ tự
// động có type đúng, không cần khai báo lại ở nơi khác.
export interface IssClientDetailsV2APIRecord {
  ClientNumber?: string;
  FirstName?: string;
  LastName?: string;
  MiddleName?: string;
  FullName?: string;
  MobilePhone?: string;
  EMail?: string;
  // thêm field khác nếu bạn có dùng ở nơi khác (vd IdentificationNumber...)
}

export interface GetClientResult {
  IssClientDetailsV2APIRecord?: IssClientDetailsV2APIRecord;
}

@Injectable()
export class ClientService {
  constructor(
    private readonly soap: SoapService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getByParams(clientId: string): Promise<GetClientResult> {
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';

    const xml = buildGetClientXml('CLIENT_ID', clientId, officer);

    return this.soap.sendRaw<GetClientResult>('GetClientByParmsV2', xml);
  }

  async createClient(userId: number, dto: CreateClientDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { clientId: true },
    });
    if (existingUser?.clientId) {
      throw new BadRequestException(
        'Bạn đã có hồ sơ khách hàng, không thể tạo thêm.',
      );
    }

    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';

    const clientNumber =
      dto.clientNumber ?? (await this.generateUniqueClientNumber());
    const dtoWithClientNumber = { ...dto, clientNumber };

    const xml = buildCreateClientXml(dtoWithClientNumber, officer);

    const way4Response = await this.soap.sendRaw<CreateClientResult>(
      'CreateClientV4',
      xml,
    );

    if (String(way4Response.RetCode) !== '0') {
      throw new InternalServerErrorException(
        `Lỗi từ WAY4: ${way4Response.RetMsg}`,
      );
    }

    const newClientId = String(way4Response.NewClient ?? '');

    if (!newClientId) {
      throw new InternalServerErrorException(
        'Không lấy được Client ID từ WAY4',
      );
    }

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

  private async generateUniqueClientNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const timestamp = Date.now().toString();
      const random = Math.floor(100 + Math.random() * 900);
      const candidate = `${timestamp}${random}`;

      const existing = await this.prisma.user.findFirst({
        where: { clientNumber: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
    }
    throw new InternalServerErrorException(
      'Không thể sinh mã khách hàng duy nhất, vui lòng thử lại.',
    );
  }

  async updateClient(clientId: string, dto: UpdateClientDto) {
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';

    const xml = buildEditClientXml('CLIENT_ID', clientId, dto, officer);

    const response = await this.soap.sendRaw<EditClientResult>(
      'EditClientV6',
      xml,
    );

    if (String(response.RetCode) !== '0') {
      throw new InternalServerErrorException(
        `Lỗi từ WAY4: ${response.RetMsg || 'Không thể cập nhật hồ sơ'}`,
      );
    }

    return {
      success: true,
      message: 'Cập nhật thành công',
    };
  }
}
