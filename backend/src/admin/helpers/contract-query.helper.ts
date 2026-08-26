import { Prisma, ContractType } from '@prisma/client';

export interface ContractQueryFilters {
  search?: string;
  type?: string; // nhận string từ query, cast sang ContractType nếu hợp lệ
  contractNumber?: string;
  contractName?: string;
  productCode?: string;
  userEmail?: string;
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
  if (query.userEmail) {
    where.user = {
      email: { contains: query.userEmail.trim(), mode: 'insensitive' },
    };
  }

  // Search tổng hợp: OR trên các cột chính + cột email của bảng liên kết
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

// Danh sách field hợp lệ để sort — phải khớp với @IsIn(...) trong GetAdminContractsQueryDto
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
      // sort theo cột thuộc bảng liên kết User
      return { user: { email: sortOrder } };
    default:
      return { createdAt: 'desc' };
  }
}
