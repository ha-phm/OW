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
    default:
      return { createdAt: 'desc' };
  }
}
