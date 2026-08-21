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
  // QUẢN LÝ HỢP ĐỒNG (ADMIN)
  // ---------------------------------------------------------------------
  async listAllContracts(
    query: GetAdminContractsQueryDto & {
      contractNumber?: string;
      contractName?: string;
      productCode?: string;
      userEmail?: string;
    },
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

    const filtered = mapped.filter((c) => {
      // 1. Lọc theo Loại (Type)
      if (query.type && c.type !== query.type) return false;

      // 2. Lọc bằng thanh Search tổng hợp
      if (query.search) {
        const q = query.search.trim().toLowerCase();
        if (!(
          c.contractNumber.toLowerCase().includes(q) ||
          c.contractName.toLowerCase().includes(q) ||
          c.clientNumber.toLowerCase().includes(q) ||
          c.userEmail.toLowerCase().includes(q)
        )) {
          return false;
        }
      }

      // 3. Lọc theo từng cột (Column Filters)
      if (
        query.contractNumber &&
        !c.contractNumber
          .toLowerCase()
          .includes(query.contractNumber.trim().toLowerCase())
      )
        return false;
      if (
        query.contractName &&
        !c.contractName
          .toLowerCase()
          .includes(query.contractName.trim().toLowerCase())
      )
        return false;
      if (
        query.productCode &&
        !c.productCode
          .toLowerCase()
          .includes(query.productCode.trim().toLowerCase())
      )
        return false;
      if (
        query.userEmail &&
        !c.userEmail
          .toLowerCase()
          .includes(query.userEmail.trim().toLowerCase())
      )
        return false;

      return true; // Giữ lại nếu thoả mãn mọi điều kiện
    });

    return paginate(filtered, query.page, query.pageSize);
  }

  // ---------------------------------------------------------------------
  // QUẢN LÝ THẺ (ADMIN)
  // ---------------------------------------------------------------------
  async listAllCards(
    query: GetAdminCardsQueryDto & {
      cardNumber?: string;
      cardName?: string;
      userEmail?: string;
    },
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

    const filtered = mapped.filter((c) => {
      // 1. Lọc bằng thanh Search tổng hợp
      if (query.search) {
        const q = query.search.trim().toLowerCase();
        if (!(
          c.cardNumber.toLowerCase().includes(q) ||
          c.cardName.toLowerCase().includes(q) ||
          c.embossedFirstName.toLowerCase().includes(q) ||
          c.embossedLastName.toLowerCase().includes(q) ||
          c.userEmail.toLowerCase().includes(q) ||
          c.issuingContractNumber.toLowerCase().includes(q)
        )) {
          return false;
        }
      }

      // 2. Lọc theo từng cột (Column Filters)
      if (
        query.cardNumber &&
        !c.cardNumber
          .toLowerCase()
          .includes(query.cardNumber.trim().toLowerCase())
      )
        return false;
      if (
        query.cardName &&
        !c.cardName.toLowerCase().includes(query.cardName.trim().toLowerCase())
      )
        return false;
      if (
        query.userEmail &&
        !c.userEmail
          .toLowerCase()
          .includes(query.userEmail.trim().toLowerCase())
      )
        return false;

      return true; // Giữ lại nếu thoả mãn mọi điều kiện
    });

    return paginate(filtered, query.page, query.pageSize);
  }

  // Thêm hàm này vào class AdminService
  async getDashboardStats() {
    // Dùng Promise.all để chạy 3 lệnh đếm song song -> Tốc độ x3
    const [totalUsers, totalContracts, totalCards] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.contract.count(),
      this.prisma.card.count(),
    ]);

    // Tính trung bình thẻ / khách hàng
    const avgCardsPerUser =
      totalUsers > 0 ? (totalCards / totalUsers).toFixed(1) : '0.0';

    return {
      totalUsers,
      totalContracts,
      totalCards,
      avgCardsPerUser: parseFloat(avgCardsPerUser),
    };
  }
}
