import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ContractType } from '@prisma/client';
import { GetAdminContractsQueryDto } from './dto/get-admin-contracts-query.dto';
import { GetAdminCardsQueryDto } from './dto/get-admin-cards-query.dto';

const userListSelect = {
  id: true,
  email: true,
  clientId: true,
  clientNumber: true,
  role: true,
  createdAt: true,
} as const;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AdminContractItem {
  id: number;
  contractNumber: string;
  contractName: string;
  type: ContractType;
  productCode: string;
  clientNumber: string;
  userEmail: string;
  createdAt: Date;
}

export interface AdminCardItem {
  id: number;
  cardNumber: string;
  cardName: string;
  embossedFirstName: string;
  embossedLastName: string;
  expiryDate: string | null;
  issuingContractNumber: string;
  userEmail: string;
  clientNumber: string;
  createdAt: Date;
}

// Cắt trang trong bộ nhớ, dùng chung cho mọi danh sách admin bên dưới —
// giống cách CardService/ContractService đang lọc + phân trang phía JS
// thay vì đẩy `contains`/`mode: insensitive` xuống Prisma.
function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    meta: { page, pageSize, total, totalPages },
  };
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  findAllUsers() {
    return this.prisma.user.findMany({
      select: userListSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(id: number, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: userListSelect,
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Đã xoá người dùng' };
  }

  // ---------------------------------------------------------------------
  // QUẢN LÝ HỢP ĐỒNG (ADMIN) — danh sách phẳng TOÀN BỘ hợp đồng của mọi
  // khách hàng, có tìm kiếm + lọc loại + phân trang. Đọc từ DB nội bộ
  // (không gọi WAY4) để tránh phải gọi SOAP riêng cho từng client khi
  // liệt kê hàng trăm/nghìn hợp đồng cùng lúc.
  // ---------------------------------------------------------------------
  async listAllContracts(
    query: GetAdminContractsQueryDto,
  ): Promise<PaginatedResult<AdminContractItem>> {
    const contracts = await this.prisma.contract.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const mapped: AdminContractItem[] = contracts.map((c) => ({
      id: c.id,
      contractNumber: c.contractNumber,
      contractName: c.contractName ?? '',
      type: c.type,
      productCode: c.productCode ?? '',
      clientNumber: c.clientNumber,
      userEmail: c.user?.email ?? '',
      createdAt: c.createdAt,
    }));

    const q = query.search?.trim().toLowerCase();
    const filtered = mapped.filter((c) => {
      if (query.type && c.type !== query.type) return false;
      if (!q) return true;
      return (
        c.contractNumber.toLowerCase().includes(q) ||
        c.contractName.toLowerCase().includes(q) ||
        c.clientNumber.toLowerCase().includes(q) ||
        c.userEmail.toLowerCase().includes(q)
      );
    });

    return paginate(filtered, query.page, query.pageSize);
  }

  // ---------------------------------------------------------------------
  // QUẢN LÝ THẺ (ADMIN) — tương tự, danh sách phẳng toàn bộ thẻ của mọi
  // khách hàng, kèm email chủ sở hữu và số hợp đồng phát hành.
  // ---------------------------------------------------------------------
  async listAllCards(
    query: GetAdminCardsQueryDto,
  ): Promise<PaginatedResult<AdminCardItem>> {
    const cards = await this.prisma.card.findMany({
      include: {
        issuingContract: {
          include: { user: { select: { email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped: AdminCardItem[] = cards.map((card) => ({
      id: card.id,
      cardNumber: card.cardNumber,
      cardName: card.cardName || 'Card Contract',
      embossedFirstName: card.embossedFirstName || '',
      embossedLastName: card.embossedLastName || '',
      expiryDate: card.expiryDate,
      issuingContractNumber: card.issuingContract.contractNumber,
      userEmail: card.issuingContract.user?.email ?? '',
      clientNumber: card.issuingContract.clientNumber,
      createdAt: card.createdAt,
    }));

    const q = query.search?.trim().toLowerCase();
    const filtered = q
      ? mapped.filter(
          (c) =>
            c.cardNumber.toLowerCase().includes(q) ||
            c.cardName.toLowerCase().includes(q) ||
            c.embossedFirstName.toLowerCase().includes(q) ||
            c.embossedLastName.toLowerCase().includes(q) ||
            c.userEmail.toLowerCase().includes(q) ||
            c.issuingContractNumber.toLowerCase().includes(q),
        )
      : mapped;

    return paginate(filtered, query.page, query.pageSize);
  }
}
