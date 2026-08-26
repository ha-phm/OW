import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ContractType } from '@prisma/client';
import { GetAdminContractsQueryDto } from './dto/get-admin-contracts-query.dto';
import { GetAdminCardsQueryDto } from './dto/get-admin-cards-query.dto';
import { PaginatedResult, buildMeta } from './helpers/pagination.helper';
import {
  buildContractWhere,
  buildContractOrderBy,
} from './helpers/contract-query.helper';
import { buildCardWhere, buildCardOrderBy } from './helpers/card-query.helper';

const userListSelect = {
  id: true,
  email: true,
  clientId: true,
  clientNumber: true,
  role: true,
  createdAt: true,
} as const;

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
    const where = buildContractWhere(query);
    const orderBy = buildContractOrderBy(
      query.sortBy,
      query.sortOrder ?? 'desc',
    );
    const skip = (query.page - 1) * query.pageSize;

    // Chạy song song: lấy đúng 1 trang dữ liệu + đếm tổng, không load toàn bộ bảng
    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        include: { user: { select: { email: true } } },
      }),
      this.prisma.contract.count({ where }),
    ]);

    const data: AdminContractItem[] = contracts.map((c) => ({
      id: c.id,
      contractNumber: c.contractNumber,
      contractName: c.contractName ?? '',
      type: c.type,
      productCode: c.productCode ?? '',
      clientNumber: c.clientNumber,
      userEmail: c.user?.email ?? '',
      createdAt: c.createdAt,
    }));

    return { data, meta: buildMeta(query.page, query.pageSize, total) };
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
    const where = buildCardWhere(query);
    const orderBy = buildCardOrderBy(query.sortBy, query.sortOrder ?? 'desc');
    const skip = (query.page - 1) * query.pageSize;

    const [cards, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        include: {
          issuingContract: { include: { user: { select: { email: true } } } },
        },
      }),
      this.prisma.card.count({ where }),
    ]);

    const data: AdminCardItem[] = cards.map((card) => ({
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

    return { data, meta: buildMeta(query.page, query.pageSize, total) };
  }

  async getDashboardStats() {
    const [totalUsers, totalContracts, totalCards] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.contract.count(),
      this.prisma.card.count(),
    ]);

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
