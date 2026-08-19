import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SoapService } from '../soap/soap.service';
import { EditCardDto } from './dto/edit-card.dto';
import { buildCreateCardXml, buildEditCardXml } from './card.templates';
import {
  asRecord,
  toComparableString,
} from '../common/utils/way4-response.util';

export interface CreateCardParams {
  issuingContractNumber: string;
  productCode: string;
  embossedFirstName: string;
  embossedLastName: string;
  embossedCompanyName?: string;
  cardName?: string;
  cbsNumber?: string;
}

export interface CardContractResponse {
  cardNumber: string;
  expiryDate: string;
  sequenceNumber: string;
}

export interface Way4CardRecord {
  CardNumber?: string;
  CardName?: string;
  EmbossedFirstName?: string;
  EmbossedLastName?: string;
  EmbossedCompanyName?: string;
  Status?: string;
  ExpirationDate?: string | number;
  Product?: string;
  CreditLimit?: string | number;
  Available?: string | number;
}

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
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';
    const xml = buildCreateCardXml(
      {
        issuingContractNumber: params.issuingContractNumber,
        productCode: params.productCode,
        cardName: params.cardName ?? 'Card Contract',
        embossedFirstName: params.embossedFirstName,
        embossedLastName: params.embossedLastName,
        embossedCompanyName: params.embossedCompanyName,
        cbsNumber: params.cbsNumber,
      },
      officer,
    );
    const rawResult = await this.soap.sendRaw('CreateCardV3', xml);

    const envelope = asRecord(rawResult) ?? {};
    const data = asRecord(envelope.CreateCardV3Result) ?? envelope;
    const retCode = toComparableString(data.RetCode);

    if (retCode === undefined || retCode !== '0') {
      this.logger.error('CreateCardV3 thất bại', data);
      throw new InternalServerErrorException(
        typeof data.RetMsg === 'string'
          ? data.RetMsg
          : 'Không thể tạo thẻ trên WAY4.',
      );
    }

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
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';
    const xml = buildEditCardXml(cardNumber, dto, officer);
    const rawResult = await this.soap.sendRaw('EditCardV2', xml);

    const envelope = asRecord(rawResult) ?? {};
    const data = asRecord(envelope.EditCardV2Result) ?? envelope;
    const retCode = toComparableString(data.RetCode);

    if (retCode === undefined || retCode !== '0') {
      this.logger.error('EditCardV2 thất bại', data);
      throw new InternalServerErrorException(
        typeof data.RetMsg === 'string'
          ? data.RetMsg
          : 'Không thể cập nhật thẻ trên WAY4.',
      );
    }
  }
}
