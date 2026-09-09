import { Prisma, ContractType } from '@prisma/client';

export interface ContractQueryFilters {
  search?: string;
  type?: string;
  contractNumber?: string;
  contractName?: string;
  productCode?: string;
  userEmail?: string;
  userIsActive?: string;
}

const VALID_CONTRACT_TYPES: readonly string[] = Object.values(ContractType);

export function buildContractWhere(
  query: ContractQueryFilters,
): Prisma.ContractWhereInput {
  const where: Prisma.ContractWhereInput = {};

  if (query.type && VALID_CONTRACT_TYPES.includes(query.type)) {
    where.type = query.type as ContractType;
  }

  if (query.contractNumber) {
    where.contractNumber = {
      contains: query.contractNumber.trim(),
      mode: 'insensitive',
    };
  }
  if (query.contractName) {
    where.contractName = {
      contains: query.contractName.trim(),
      mode: 'insensitive',
    };
  }
  if (query.productCode) {
    where.productCode = {
      contains: query.productCode.trim(),
      mode: 'insensitive',
    };
  }

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
    where.user = userConditions;
  }

  if (query.search) {
    const q = query.search.trim();
    where.OR = [
      { contractNumber: { contains: q, mode: 'insensitive' } },
      { contractName: { contains: q, mode: 'insensitive' } },
      { clientNumber: { contains: q, mode: 'insensitive' } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  return where;
}

export function buildContractOrderBy(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' = 'desc',
): Prisma.ContractOrderByWithRelationInput {
  switch (sortBy) {
    case 'contractNumber':
    case 'contractName':
    case 'type':
    case 'productCode':
    case 'clientNumber':
    case 'createdAt':
      return { [sortBy]: sortOrder };
    case 'userEmail':
      return { user: { email: sortOrder } };
    case 'userIsActive':
      return { user: { isActive: sortOrder } };
    default:
      return { createdAt: 'desc' };
  }
}
