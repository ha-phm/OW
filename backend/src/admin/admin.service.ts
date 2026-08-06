import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

const userListSelect = {
  id: true,
  email: true,
  clientId: true,
  clientNumber: true,
  role: true,
  createdAt: true,
} as const;

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
}
