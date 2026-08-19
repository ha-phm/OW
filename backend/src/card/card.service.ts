import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Card } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CardWay4Service,
  CreateCardParams,
  CardContractResponse,
} from './card-way4.service';
import { EditCardDto } from './dto/edit-card.dto';
import { GetCardsQueryDto } from './dto/get-cards-query.dto';
import { splitWay4Field } from '../common/way4.util';
import {
  asRecord,
  toNumberOrUndefined,
} from '../common/utils/way4-response.util';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
export type { PaginatedResult };
export type { CardContractResponse };
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
    private readonly prisma: PrismaService,
    private readonly way4Service: CardWay4Service,
  ) {}

  // Forwarding request cho ContractService sử dụng khi mở thẻ nhanh
  async createCardContract(
    params: CreateCardParams,
  ): Promise<CardContractResponse> {
    return this.way4Service.createCardContract(params);
  }

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

  private formatExpiry(raw?: string | number | null): string | undefined {
    if (raw === null || raw === undefined || raw === '') return undefined;
    const str = String(raw);
    if (/^\d{4}$/.test(str)) {
      return `${str.slice(2, 4)}/${str.slice(0, 2)}`;
    }
    return str;
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

    const way4ByNumber =
      await this.way4Service.fetchWay4CardsSafely(clientNumber);

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
      issuingContractNumber: '',
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
      const raw = await this.way4Service.getCardDetailRaw(cardNumber);
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

  async editCardForUser(
    userId: number,
    cardNumber: string,
    dto: EditCardDto,
  ): Promise<CardDetail> {
    const card = await this.assertCardAccessible(cardNumber, userId);

    // Đẩy tác vụ gọi XML qua Way4Service
    await this.way4Service.editCardV2(cardNumber, dto);

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
