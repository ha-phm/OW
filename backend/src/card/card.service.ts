import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CardWay4Service } from './card-way4.service';
import { EditCardDto } from './dto/edit-card.dto';
import { GetCardsQueryDto } from './dto/get-cards-query.dto';
import { GetAdminCardsQueryDto } from '../admin/dto/get-admin-cards-query.dto'; // Import DTO của Admin
import {
  CardListItem,
  CardDetail,
  AdminCardItem,
} from './interfaces/card.interface';
import { formatExpiry, mapWay4CardDetail } from './mappers/card.mapper';
import {
  filterCardsInMemory,
  sortCardsInMemory,
} from './helpers/card-memory.helper';
import { buildCardWhere, buildCardOrderBy } from './helpers/card-query.helper'; // Đã dời từ thư mục Admin sang
import { maskCardNumber } from '../common/utils/text.utils';
import { splitWay4Field } from '../common/way4.util';
import { toNumberOrUndefined } from '../common/utils/way4-response.util';
import {
  PaginatedResult,
  buildMeta,
} from '../common/interfaces/paginated-result.interface';
import {
  CreateCardParams,
  CardContractResponse,
} from './interfaces/card-way4.interface';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly way4Service: CardWay4Service,
  ) {}

  // ---------------------------------------------------------------------
  // QUẢN LÝ THẺ DÀNH CHO USER (CLIENT APP)
  // ---------------------------------------------------------------------

  async createCardContract(
    params: CreateCardParams,
  ): Promise<CardContractResponse> {
    return this.way4Service.createCardContract(params);
  }

  async assertCardAccessible(cardNumber: string, userId: number) {
    const card = await this.prisma.card.findFirst({
      where: { cardNumber, issuingContract: { userId } },
      include: {
        issuingContract: {
          select: {
            contractNumber: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Không tìm thấy thẻ này thuộc về bạn.');
    }

    return card;
  }

  async listCardsForUser(
    userId: number,
    clientNumber: string,
    query: GetCardsQueryDto,
  ): Promise<PaginatedResult<CardListItem>> {
    // BƯỚC 1: TRUY VẤN TỐI ƯU VỚI SELECT
    const ownedCards = await this.prisma.card.findMany({
      where: { issuingContract: { userId } },
      orderBy: { createdAt: 'desc' },
      select: {
        cardNumber: true,
        cardName: true,
        embossedFirstName: true,
        embossedLastName: true,
        status: true,
        expiryDate: true,
        issuingContract: {
          select: {
            contractNumber: true,
          },
        },
      },
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

    // BƯỚC 2: GỌI HỆ THỐNG WAY4
    const way4ByNumber =
      await this.way4Service.fetchWay4CardsSafely(clientNumber);

    // BƯỚC 3: MAP DỮ LIỆU
    const mapped: CardListItem[] = ownedCards.map((card) => {
      const way4 = way4ByNumber.get(card.cardNumber);
      return {
        cardNumber: card.cardNumber,
        maskedCardNumber: maskCardNumber(card.cardNumber),
        cardName: card.cardName || way4?.CardName || 'Card Contract',
        embossedFirstName:
          card.embossedFirstName || way4?.EmbossedFirstName || '',
        embossedLastName: card.embossedLastName || way4?.EmbossedLastName || '',
        embossedCompanyName: way4?.EmbossedCompanyName,
        status: way4?.Status ? splitWay4Field(way4.Status).label : card.status,
        expiryDate: formatExpiry(way4?.ExpirationDate ?? card.expiryDate),
        productName: way4?.Product
          ? splitWay4Field(way4.Product).label
          : undefined,
        creditLimit: toNumberOrUndefined(way4?.CreditLimit),
        available: toNumberOrUndefined(way4?.Available),

        // Dữ liệu contractNumber đã được truy vấn lồng một cách an toàn
        issuingContractNumber: card.issuingContract.contractNumber,
      };
    });

    // BƯỚC 4: LỌC & SẮP XẾP IN-MEMORY
    let filtered = filterCardsInMemory(mapped, query);
    filtered = sortCardsInMemory(filtered, query.sortBy, query.sortOrder);

    const { page, pageSize } = query;
    const total = filtered.length;
    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async getCardDetailForUser(
    userId: number,
    cardNumber: string,
  ): Promise<CardDetail> {
    const card = await this.assertCardAccessible(cardNumber, userId);
    let detail: CardDetail;

    try {
      const raw = await this.way4Service.getCardDetailRaw(cardNumber);
      detail = mapWay4CardDetail(raw, card);
    } catch {
      this.logger.warn(
        'Không lấy được chi tiết thẻ từ WAY4, dùng dữ liệu nội bộ.',
      );
      detail = mapWay4CardDetail(undefined, card);
    }

    detail.issuingContractNumber = card.issuingContract?.contractNumber || '';
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

      select: {
        cardNumber: true,
        cardName: true,
        embossedFirstName: true,
        embossedLastName: true,
        status: true,
        expiryDate: true,
        issuingContract: {
          select: {
            contractNumber: true,
          },
        },
      },
    });

    return {
      cardNumber: updated.cardNumber,
      maskedCardNumber: maskCardNumber(updated.cardNumber),
      cardName: updated.cardName || 'Card Contract',
      embossedFirstName: updated.embossedFirstName || '',
      embossedLastName: updated.embossedLastName || '',
      embossedCompanyName: dto.embossedCompanyName,
      status: updated.status,
      expiryDate: formatExpiry(updated.expiryDate),
      issuingContractNumber: updated.issuingContract.contractNumber,
    };
  }

  // ---------------------------------------------------------------------
  // QUẢN LÝ THẺ DÀNH CHO ADMIN (BACKOFFICE)
  // ---------------------------------------------------------------------

  async listAllCards(
    query: GetAdminCardsQueryDto,
  ): Promise<PaginatedResult<AdminCardItem>> {
    const where = buildCardWhere(query);
    const orderBy = buildCardOrderBy(query.sortBy, query.sortOrder ?? 'desc');
    const skip = (query.page - 1) * query.pageSize;

    const [cards, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        // THAY THẾ INCLUDE BẰNG SELECT
        select: {
          id: true,
          cardNumber: true,
          cardName: true,
          embossedFirstName: true,
          embossedLastName: true,
          expiryDate: true,
          createdAt: true,
          issuingContract: {
            select: {
              contractNumber: true,
              clientNumber: true,
              user: {
                select: { email: true, isActive: true },
              },
            },
          },
        },
      }),
      this.prisma.card.count({ where }),
    ]);

    const data: AdminCardItem[] = cards.map((card) => ({
      id: card.id,
      cardNumber: card.cardNumber,
      maskedCardNumber: maskCardNumber(card.cardNumber),
      cardName: card.cardName || 'Card Contract',
      embossedFirstName: card.embossedFirstName || '',
      embossedLastName: card.embossedLastName || '',
      expiryDate: card.expiryDate,
      issuingContractNumber: card.issuingContract.contractNumber,
      userEmail: card.issuingContract.user?.email ?? '',
      clientNumber: card.issuingContract.clientNumber,
      userIsActive: card.issuingContract.user?.isActive ?? false,
      createdAt: card.createdAt,
    }));

    return { data, meta: buildMeta(query.page, query.pageSize, total) };
  }
}
export type { CardListItem, CardDetail, PaginatedResult };
