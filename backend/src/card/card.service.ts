import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Card } from '@prisma/client';
import { SoapService } from '../soap/soap.service';
import { PrismaService } from '../prisma/prisma.service';
import { EditCardDto } from './dto/edit-card.dto';
import { GetCardsQueryDto } from './dto/get-cards-query.dto';
import { buildCreateCardXml, buildEditCardXml } from './card.templates';
import { splitWay4Field } from '../common/way4.util';
import {
  asRecord,
  toComparableString,
  toNumberOrUndefined,
} from '../common/utils/way4-response.util';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

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

export interface CardListItem {
  cardNumber: string;
  cardName: string;
  embossedFirstName: string;
  embossedLastName: string;
  embossedCompanyName?: string;
  status: string;
  expiryDate?: string;
  productName?: string;
  creditLimit?: number;
  available?: number;
  issuingContractNumber: string;
}

export interface CardDetail extends CardListItem {
  currency?: string;
  openDate?: string;
  branch?: string;
  institution?: string;
  clientFullName?: string;
  totalDue?: number;
  pastDue?: number;
}

export type { PaginatedResult };

interface Way4CreateCardResult {
  CreatedCard?: string;
  CardNumber?: string;
  ExpiryDate?: string;
  SequenceNumber?: string;
}

interface Way4CardRecord {
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

interface Way4CardDetailRecord {
  ContractNumber?: string;
  ContractName?: string;
  Status?: string;
  Product?: string;
  Currency?: string;
  CreditLimit?: string | number;
  Available?: string | number;
  TotalDue?: string | number;
  PastDue?: string | number;
  OpenDate?: string;
  Institution?: string;
  Branch?: string;
  ClientFullName?: string;
  EmbossedFirstName?: string;
  EmbossedLastName?: string;
  EmbossedCompanyName?: string;
  ExpirationDate?: string | number;
}

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private readonly soap: SoapService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ---------------------------------------------------------------------
  // TẠO THẺ (CreateCardV3) — được ContractService.addCardUnderIssuing gọi
  // ngay sau khi tạo Issuing. KHÔNG có endpoint tạo thẻ riêng trong module
  // này, tránh trùng lặp flow Liability -> Issuing -> Card.
  // ---------------------------------------------------------------------
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
    const result = this.extractCreateCardResult(rawResult);

    return {
      cardNumber: String(result.CardNumber!),
      expiryDate: String(result.ExpiryDate ?? ''),
      sequenceNumber: String(result.SequenceNumber ?? ''),
    };
  }

  private extractCreateCardResult(rawResult: unknown): Way4CreateCardResult {
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
      this.logger.error('CreateCardV3 không trả về CardNumber', data);
      throw new InternalServerErrorException(
        'WAY4 không trả về số thẻ sau khi tạo.',
      );
    }

    return {
      CreatedCard: toComparableString(data.CreatedCard),
      CardNumber: cardNumber,
      ExpiryDate: toComparableString(data.ExpiryDate),
      SequenceNumber: toComparableString(data.SequenceNumber),
    };
  }

  // ---------------------------------------------------------------------
  // Quyền sở hữu thẻ
  // ---------------------------------------------------------------------
  async assertCardAccessible(
    cardNumber: string,
    userId: number,
  ): Promise<Card> {
    const card = await this.prisma.card.findFirst({
      where: { cardNumber, issuingContract: { userId } },
    });
    if (!card) {
      throw new NotFoundException('Không tìm thấy thẻ này thuộc về bạn.');
    }
    return card;
  }

  // ---------------------------------------------------------------------
  // Helpers dùng chung
  // ---------------------------------------------------------------------
  private formatExpiry(raw?: string | number | null): string | undefined {
    if (raw === null || raw === undefined || raw === '') return undefined;
    const str = String(raw);
    // WAY4 trả ExpirationDate dạng YYMM, vd "2302" = 02/2023
    if (/^\d{4}$/.test(str)) {
      return `${str.slice(2, 4)}/${str.slice(0, 2)}`;
    }
    return str;
  }

  private async fetchWay4CardsSafely(
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
        'Không lấy được danh sách thẻ từ WAY4, dùng dữ liệu nội bộ.',
        err instanceof Error ? err.stack : String(err),
      );
      return new Map();
    }
  }

  private filterCards(items: CardListItem[], search?: string): CardListItem[] {
    const q = search?.trim().toLowerCase();
    if (!q) return items;
    const matches = (s?: string): boolean =>
      (s ?? '').toLowerCase().includes(q);
    return items.filter(
      (c) =>
        matches(c.cardNumber) ||
        matches(c.cardName) ||
        matches(c.embossedFirstName) ||
        matches(c.embossedLastName),
    );
  }

  // ---------------------------------------------------------------------
  // DANH SÁCH THẺ — phân trang + tìm kiếm, nguồn DB nội bộ enrich từ WAY4
  // ---------------------------------------------------------------------
  async listCardsForUser(
    userId: number,
    clientNumber: string,
    query: GetCardsQueryDto,
  ): Promise<PaginatedResult<CardListItem>> {
    const ownedCards = await this.prisma.card.findMany({
      where: { issuingContract: { userId } },
      orderBy: { createdAt: 'desc' },
      include: { issuingContract: true },
    });

    if (ownedCards.length === 0) {
      return {
        data: [],
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 1,
        },
      };
    }

    const way4ByNumber = await this.fetchWay4CardsSafely(clientNumber);

    const mapped: CardListItem[] = ownedCards.map((card) => {
      const way4 = way4ByNumber.get(card.cardNumber);
      return {
        cardNumber: card.cardNumber,
        cardName: card.cardName || way4?.CardName || 'Card Contract',
        embossedFirstName:
          card.embossedFirstName || way4?.EmbossedFirstName || '',
        embossedLastName: card.embossedLastName || way4?.EmbossedLastName || '',
        embossedCompanyName: way4?.EmbossedCompanyName,
        status: way4?.Status ? splitWay4Field(way4.Status).label : card.status,
        expiryDate: this.formatExpiry(way4?.ExpirationDate ?? card.expiryDate),
        productName: way4?.Product
          ? splitWay4Field(way4.Product).label
          : undefined,
        creditLimit: toNumberOrUndefined(way4?.CreditLimit),
        available: toNumberOrUndefined(way4?.Available),
        issuingContractNumber: card.issuingContract.contractNumber,
      };
    });

    const filtered = this.filterCards(mapped, query.search);
    const { page, pageSize } = query;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      meta: { page, pageSize, total, totalPages },
    };
  }

  // ---------------------------------------------------------------------
  // CHI TIẾT 1 THẺ — dùng khi bấm vào thẻ ảo để xem/sửa
  // ---------------------------------------------------------------------
  private mapWay4CardDetail(raw: unknown, fallback: Card): CardDetail {
    const envelope = asRecord(raw) ?? {};
    const record = (asRecord(envelope.IssContractDetailsAPIOutputV2Record) ??
      envelope) as Way4CardDetailRecord;

    return {
      cardNumber: fallback.cardNumber,
      cardName: fallback.cardName || record.ContractName || 'Card Contract',
      embossedFirstName:
        fallback.embossedFirstName || record.EmbossedFirstName || '',
      embossedLastName:
        fallback.embossedLastName || record.EmbossedLastName || '',
      embossedCompanyName: record.EmbossedCompanyName,
      status: record.Status
        ? splitWay4Field(record.Status).label
        : fallback.status,
      expiryDate: this.formatExpiry(
        record.ExpirationDate ?? fallback.expiryDate,
      ),
      productName: record.Product
        ? splitWay4Field(record.Product).label
        : undefined,
      creditLimit: toNumberOrUndefined(record.CreditLimit),
      available: toNumberOrUndefined(record.Available),
      currency: record.Currency
        ? splitWay4Field(record.Currency).label
        : undefined,
      openDate: record.OpenDate,
      branch: record.Branch ? splitWay4Field(record.Branch).label : undefined,
      institution: record.Institution
        ? splitWay4Field(record.Institution).label
        : undefined,
      clientFullName: record.ClientFullName,
      totalDue: toNumberOrUndefined(record.TotalDue),
      pastDue: toNumberOrUndefined(record.PastDue),
      issuingContractNumber: '', // gán ở getCardDetailForUser sau khi include quan hệ
    };
  }

  async getCardDetailForUser(
    userId: number,
    cardNumber: string,
  ): Promise<CardDetail> {
    const card = await this.prisma.card.findFirst({
      where: { cardNumber, issuingContract: { userId } },
      include: { issuingContract: true },
    });
    if (!card) {
      throw new NotFoundException('Không tìm thấy thẻ này thuộc về bạn.');
    }

    let detail: CardDetail;
    try {
      const raw = await this.soap.call('GetContractV2', {
        ContractSearchMethod: 'CONTRACT_NUMBER',
        ContractIdentifier: cardNumber,
      });
      detail = this.mapWay4CardDetail(raw, card);
    } catch (err: unknown) {
      this.logger.warn(
        'Không lấy được chi tiết thẻ từ WAY4, dùng dữ liệu nội bộ.',
        err instanceof Error ? err.stack : String(err),
      );
      detail = this.mapWay4CardDetail(undefined, card);
    }

    detail.issuingContractNumber = card.issuingContract.contractNumber;
    return detail;
  }

  // ---------------------------------------------------------------------
  // SỬA THẺ (EditCardV2)
  // ---------------------------------------------------------------------
  private assertEditSuccess(rawResult: unknown): void {
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

  async editCardForUser(
    userId: number,
    cardNumber: string,
    dto: EditCardDto,
  ): Promise<CardDetail> {
    const card = await this.assertCardAccessible(cardNumber, userId);
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';
    const xml = buildEditCardXml(cardNumber, dto, officer);
    const rawResult = await this.soap.sendRaw('EditCardV2', xml);

    // EditCardV2Result chỉ trả RetCode/RetMsg, không trả lại record -> tự
    // cập nhật DB nội bộ bằng đúng giá trị vừa gửi lên WAY4.
    this.assertEditSuccess(rawResult);

    const updated = await this.prisma.card.update({
      where: { cardNumber },
      data: {
        cardName: dto.cardName ?? card.cardName,
        embossedFirstName: dto.embossedFirstName ?? card.embossedFirstName,
        embossedLastName: dto.embossedLastName ?? card.embossedLastName,
      },
      include: { issuingContract: true },
    });

    return {
      cardNumber: updated.cardNumber,
      cardName: updated.cardName || 'Card Contract',
      embossedFirstName: updated.embossedFirstName || '',
      embossedLastName: updated.embossedLastName || '',
      embossedCompanyName: dto.embossedCompanyName,
      status: updated.status,
      expiryDate: this.formatExpiry(updated.expiryDate),
      issuingContractNumber: updated.issuingContract.contractNumber,
    };
  }
}
