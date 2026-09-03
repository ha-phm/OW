import { Prisma, ContractType } from '@prisma/client';

export interface ContractQueryFilters {
  search?: string;
  type?: string; // nhận string từ query, cast sang ContractType nếu hợp lệ
  contractNumber?: string;
  contractName?: string;
  productCode?: string;
  userEmail?: string;
  userIsActive?: string; // Bổ sung tham số nhận trạng thái
}

const VALID_CONTRACT_TYPES: readonly string[] = Object.values(ContractType);

export function buildContractWhere(
  query: ContractQueryFilters,
): Prisma.ContractWhereInput {
  const where: Prisma.ContractWhereInput = {};

  if (query.type && VALID_CONTRACT_TYPES.includes(query.type)) {
    where.type = query.type as ContractType; // Ép kiểu an toàn, không dùng any
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

  // --- SỬ DỤNG TYPE CỦA PRISMA ĐỂ KHÔNG PHẢI DÙNG ANY ---
  // Gom điều kiện liên quan đến bảng User vào chung một object
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

  // Gán vào where.user một lần duy nhất nếu có điều kiện
  if (hasUserConditions) {
    where.user = userConditions;
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
    case 'userIsActive':
      // sort theo trạng thái thuộc bảng liên kết User
      return { user: { isActive: sortOrder } };
    default:
      return { createdAt: 'desc' };
  }
}
