import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SoapService } from '../soap/soap.service';
import { EditCardDto } from './dto/edit-card.dto';
import {
  buildCreateCardXml,
  buildEditCardXml,
  buildCreateSupplementaryCardXml,
} from './card.templates';

// ĐÃ SỬA: Import extractWay4Result và xóa asRecord
import {
  extractWay4Result,
  toComparableString,
} from '../common/utils/way4-response.util';

// ĐÃ SỬA: Import toàn bộ interfaces từ file mới tạo
import {
  CreateCardParams,
  CardContractResponse,
  Way4CardRecord,
  CreateSupplementaryCardParams,
} from './interfaces/card-way4.interface';

@Injectable()
export class CardWay4Service {
  private readonly logger = new Logger(CardWay4Service.name);

  constructor(
    private readonly soap: SoapService,
    private readonly config: ConfigService,
  ) {}

  async createCardContract(
    params: CreateCardParams,
  ): Promise<CardContractResponse> {
    // Truyền thẳng params vì cấu trúc object đã khớp hoàn toàn
    const xml = buildCreateCardXml(params);
    const rawResult = await this.soap.sendRaw('CreateCardV3', xml);

    // ĐÃ SỬA: Bóc tách và check lỗi tự động bằng 1 dòng
    const data = extractWay4Result(rawResult, 'CreateCardV3');

    const cardNumber = toComparableString(data.CardNumber);
    if (cardNumber === undefined) {
      throw new InternalServerErrorException(
        'WAY4 không trả về số thẻ sau khi tạo.',
      );
    }

    return {
      cardNumber: String(cardNumber),
      expiryDate: String(toComparableString(data.ExpiryDate) ?? ''),
      sequenceNumber: String(toComparableString(data.SequenceNumber) ?? ''),
    };
  }

  async fetchWay4CardsSafely(
    clientNumber: string,
  ): Promise<Map<string, Way4CardRecord>> {
    try {
      const result = await this.soap.call<{
        CardDetailsAPIRecord?: Way4CardRecord | Way4CardRecord[];
      }>('GetCardsByClientV2', {
        ClientSearchMethod: 'CLIENT_NUMBER',
        ClientIdentifier: clientNumber,
      });
      const records = result?.CardDetailsAPIRecord;
      const list: Way4CardRecord[] = records
        ? Array.isArray(records)
          ? records
          : [records]
        : [];
      return new Map(list.map((r) => [String(r.CardNumber), r]));
    } catch (err: unknown) {
      this.logger.warn(
        'Không lấy được danh sách thẻ từ WAY4.',
        err instanceof Error ? err.stack : String(err),
      );
      return new Map();
    }
  }

  async getCardDetailRaw(cardNumber: string): Promise<unknown> {
    return this.soap.call('GetContractV2', {
      ContractSearchMethod: 'CONTRACT_NUMBER',
      ContractIdentifier: cardNumber,
    });
  }

  async editCardV2(cardNumber: string, dto: EditCardDto): Promise<void> {
    const xml = buildEditCardXml(cardNumber, dto);
    const rawResult = await this.soap.sendRaw('EditCardV2', xml);

    // ĐÃ SỬA: Chỉ cần 1 dòng này để bóc tách và văng lỗi (nếu có)
    extractWay4Result(rawResult, 'EditCardV2');
  }

  // ĐÃ SỬA: Thay 6 tham số rời rạc bằng 1 object dùng interface chung
  async callCreateSupplementaryCard(
    params: CreateSupplementaryCardParams,
  ): Promise<any> {
    const xmlPayload = buildCreateSupplementaryCardXml(params);
    return this.soap.sendRaw('CreateSupplementaryCardV2', xmlPayload);
  }
}
