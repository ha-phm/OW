import { Prisma } from '@prisma/client';

export interface CardQueryFilters {
  search?: string;
  cardNumber?: string;
  cardName?: string;
  userEmail?: string;
}

export function buildCardWhere(query: CardQueryFilters): Prisma.CardWhereInput {
  const where: Prisma.CardWhereInput = {};

  if (query.cardNumber) {
    where.cardNumber = {
      contains: query.cardNumber.trim(),
      mode: 'insensitive',
    };
  }
  if (query.cardName) {
    where.cardName = {
      contains: query.cardName.trim(),
      mode: 'insensitive',
    };
  }
  if (query.userEmail) {
    where.issuingContract = {
      user: {
        email: { contains: query.userEmail.trim(), mode: 'insensitive' },
      },
    };
  }

  // Search tổng hợp: OR trên các cột chính + số hợp đồng + email của bảng liên kết
  if (query.search) {
    const q = query.search.trim();
    where.OR = [
      { cardNumber: { contains: q, mode: 'insensitive' } },
      { cardName: { contains: q, mode: 'insensitive' } },
      { embossedFirstName: { contains: q, mode: 'insensitive' } },
      { embossedLastName: { contains: q, mode: 'insensitive' } },
      {
        issuingContract: {
          contractNumber: { contains: q, mode: 'insensitive' },
        },
      },
      {
        issuingContract: {
          user: { email: { contains: q, mode: 'insensitive' } },
        },
      },
    ];
  }

  return where;
}

// Danh sách field hợp lệ để sort — phải khớp với @IsIn(...) trong GetAdminCardsQueryDto
export function buildCardOrderBy(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' = 'desc',
): Prisma.CardOrderByWithRelationInput {
  switch (sortBy) {
    case 'cardNumber':
    case 'cardName':
    case 'expiryDate':
    case 'createdAt':
      return { [sortBy]: sortOrder };
    case 'issuingContractNumber':
      // sort theo cột thuộc bảng liên kết Contract
      return { issuingContract: { contractNumber: sortOrder } };
    case 'userEmail':
      // sort theo cột thuộc bảng liên kết Contract -> User
      return { issuingContract: { user: { email: sortOrder } } };
    default:
      return { createdAt: 'desc' };
  }
}
