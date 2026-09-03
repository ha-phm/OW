import { Prisma } from '@prisma/client';

export interface CardQueryFilters {
  cardNumber?: string;
  cardName?: string;
  userEmail?: string;
  userIsActive?: string;
  search?: string;
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

  // --- XỬ LÝ LỌC QUAN HỆ BẮC CẦU (USER) AN TOÀN ---
  // Gom chung các điều kiện của user vào 1 object để không bị ghi đè lẫn nhau
  const userConditions: Prisma.UserWhereInput = {};
  let hasUserConditions = false;

  if (query.userEmail) {
    userConditions.email = {
      contains: query.userEmail.trim(),
      mode: 'insensitive',
    };
    hasUserConditions = true;
  }

  if (query.userIsActive === 'true' || query.userIsActive === 'false') {
    userConditions.isActive = query.userIsActive === 'true';
    hasUserConditions = true;
  }

  if (hasUserConditions) {
    where.issuingContract = {
      user: userConditions,
    };
  }

  // --- XỬ LÝ SEARCH CHUNG ---
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
      return { issuingContract: { contractNumber: sortOrder } };

    case 'userEmail':
      return { issuingContract: { user: { email: sortOrder } } };

    // THÊM LOGIC SORT THEO TRẠNG THÁI Ở ĐÂY
    case 'userIsActive':
      return { issuingContract: { user: { isActive: sortOrder } } };

    default:
      return { createdAt: 'desc' };
  }
}
