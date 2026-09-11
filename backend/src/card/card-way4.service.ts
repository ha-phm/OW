import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SoapService } from '../soap/soap.service';
import { EditCardDto } from './dto/edit-card.dto';
import {
  buildCreateCardXml,
  buildEditCardXml,
  buildCreateSupplementaryCardXml,
} from './card.templates';
import {
  extractWay4Result,
  toComparableString,
} from '../common/utils/way4-response.util';
import {
  CreateCardParams,
  CardContractResponse,
  Way4CardRecord,
  CreateSupplementaryCardParams,
} from './interfaces/card-way4.interface';

@Injectable()
export class CardWay4Service {
  private readonly logger = new Logger(CardWay4Service.name);

  constructor(private readonly soap: SoapService) {}

  async createCardContract(
    params: CreateCardParams,
  ): Promise<CardContractResponse> {
    const xml = buildCreateCardXml(params);
    const rawResult = await this.soap.sendRaw('CreateCardV3', xml);

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

    extractWay4Result(rawResult, 'EditCardV2');
  }

  async callCreateSupplementaryCard(
    params: CreateSupplementaryCardParams,
  ): Promise<any> {
    const xmlPayload = buildCreateSupplementaryCardXml(params);
    return this.soap.sendRaw('CreateSupplementaryCardV2', xmlPayload);
  }
}
