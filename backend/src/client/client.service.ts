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

@Injectable()
export class ClientService {
  constructor(
    private readonly soap: SoapService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getByParams(clientId: string) {
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';

    const xml = buildGetClientXml('CLIENT_ID', clientId, officer);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.soap.sendRaw<any>('GetClientByParmsV2', xml);
  }

  async createClient(userId: number, dto: CreateClientDto) {
    // Chặn tạo trùng: nếu user đã có clientId rồi thì từ chối luôn
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

    // Kiểm tra mã lỗi từ hệ thống (0 là thành công)
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

    // Thêm tham số searchMethod (CLIENT_ID) khớp với hàm buildEditClientXml
    const xml = buildEditClientXml('CLIENT_ID', clientId, dto, officer);

    const response = await this.soap.sendRaw<EditClientResult>(
      'EditClientV6',
      xml,
    );

    // Kiểm tra lỗi đồng bộ như ở createClient
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
