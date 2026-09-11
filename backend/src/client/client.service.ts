import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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
import { assertWay4Success } from '../common/utils/way4-response.util';
import { generateClientNumber } from '../common/utils/text.utils';

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
  Gender?: string;
  MaritalStatusCode?: string;
  MaritalStatus?: string;
  BirthDate?: string;
  Citizenship?: string;
  IdentityCardNumber?: string;
  IdentityCardDetails?: string;
  IndividualTaxpayerNumber?: string;
  SocialSecurityNumber?: string;
  AddressLine1?: string;
  City?: string;
  HomePhone?: string;
  CompanyName?: string;
  Profession?: string;
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

  /**
   * Kiểm tra RetCode chuẩn từ WAY4 và bọc lỗi lại đúng theo format thông
   * báo mà API này đang dùng (`Lỗi từ WAY4: <RetMsg>`). Dùng chung
   * `assertWay4Success` từ common/ thay vì tự so sánh RetCode ở từng nơi.
   */
  private assertWay4Ok(
    data: Record<string, unknown>,
    fallbackMessage: string,
  ): void {
    try {
      assertWay4Success(data, fallbackMessage);
    } catch (err) {
      const message = err instanceof Error ? err.message : fallbackMessage;
      throw new InternalServerErrorException(`Lỗi từ WAY4: ${message}`);
    }
  }

  async getByParams(clientId: string): Promise<GetClientResult> {
    const xml = buildGetClientXml('CLIENT_ID', clientId);
    return this.soap.sendRaw<GetClientResult>('GetClientByParmsV2', xml);
  }

  async createClientWay4Only(
    dto: CreateClientDto & { clientNumber: string },
  ): Promise<{ clientId: string; clientNumber: string }> {
    const xml = buildCreateClientXml(dto);

    // Gửi SOAP Request
    const way4Response = await this.soap.sendRaw<CreateClientResult>(
      'CreateClientV4',
      xml,
    );

    this.assertWay4Ok(
      way4Response as unknown as Record<string, unknown>,
      'Không thể tạo hồ sơ khách hàng trên WAY4.',
    );

    const newClientId = String(way4Response.NewClient ?? '');
    if (!newClientId) {
      throw new InternalServerErrorException(
        'Không lấy được Client ID từ WAY4',
      );
    }

    // TRẢ VỀ LUÔN - KHÔNG GỌI THIS.PRISMA.USER.UPDATE Ở ĐÂY NỮA
    return { clientId: newClientId, clientNumber: dto.clientNumber };
  }

  // ... (giữ nguyên hàm createClientWay4Only vừa viết ở bước trước)

  /**
   * Hàm này dành riêng cho API POST /clients
   * Dùng khi User ĐÃ CÓ TÀI KHOẢN nhưng chưa tạo hồ sơ khách hàng.
   */
  async createClientForUser(userId: number, dto: CreateClientDto) {
    // 1. Kiểm tra xem User này đã có hồ sơ chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { clientId: true },
    });

    if (existingUser?.clientId) {
      throw new BadRequestException(
        'Bạn đã có hồ sơ khách hàng, không thể tạo thêm.',
      );
    }

    // 2. Sinh mã khách hàng (TÁI SỬ DỤNG HÀM CÓ SẴN, XÓA require('crypto'))
    const clientNumber = dto.clientNumber ?? generateClientNumber();

    // 3. Gọi hàm giao tiếp WAY4
    const way4Result = await this.createClientWay4Only({
      ...dto,
      clientNumber, // Truyền mã vừa sinh vào đây
    });

    // 4. Lưu vào Database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        clientId: way4Result.clientId,
        clientNumber: way4Result.clientNumber,
      },
    });

    return {
      success: true,
      clientId: way4Result.clientId,
      clientNumber: way4Result.clientNumber,
    };
  }

  async updateClient(
    clientId: string,
    dto: UpdateClientDto,
  ): Promise<{ success: boolean; message: string }> {
    const xml = buildEditClientXml('CLIENT_ID', clientId, dto);
    const response = await this.soap.sendRaw<EditClientResult>(
      'EditClientV6',
      xml,
    );

    this.assertWay4Ok(
      response as unknown as Record<string, unknown>,
      'Không thể cập nhật hồ sơ',
    );

    return { success: true, message: 'Cập nhật thành công' };
  }
}
