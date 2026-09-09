import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { buildMeta } from './helpers/pagination.helper';
import { GetAdminUsersQueryDto } from './dto/get-admin-users-query.dto';

const userListSelect = {
  id: true,
  email: true,
  clientId: true,
  clientNumber: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async listAllUsers(
    query: GetAdminUsersQueryDto & {
      clientNumber?: string;
      role?: Role;
      isActive?: string;
      email?: string; // Thêm type email
    },
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {};

    // 1. TÌM KIẾM CHUNG (Từ khóa gõ vào ô search sẽ tìm qua email)
    if (query.search) {
      where.email = { contains: query.search, mode: 'insensitive' };
    }

    // 2. TÌM KIẾM CỤ THỂ THEO CỘT EMAIL (Khi user chọn dropdown là "Email")
    if (query.email) {
      where.email = { contains: query.email, mode: 'insensitive' };
    }

    if (query.clientNumber) {
      where.clientNumber = {
        contains: query.clientNumber,
        mode: 'insensitive',
      };
    }

    if (query.role) {
      where.role = query.role;
    }

    // SỬA LẠI CHỖ NÀY: Phải đảm bảo giá trị truyền lên chính xác là chữ 'true' hoặc 'false'
    if (query.isActive === 'true' || query.isActive === 'false') {
      where.isActive = query.isActive === 'true';
    }

    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy) {
      orderBy = { [query.sortBy]: query.sortOrder ?? 'desc' };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: userListSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, meta: buildMeta(page, pageSize, total) };
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

    // Thay vì delete, update isActive = false
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Đã vô hiệu hoá tài khoản người dùng' };
  }

  async restoreUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: 'Đã mở khóa tài khoản người dùng thành công' };
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
