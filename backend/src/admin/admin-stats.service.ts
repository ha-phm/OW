// src/admin/admin-stats.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardChartData() {
    const rawDistribution = await this.prisma.card.groupBy({
      by: ['productCode'],
      _count: {
        id: true,
      },
      where: {
        // Có thể thêm điều kiện lọc thẻ đang active nếu muốn
        // status: 'Card OK'
      },
    });

    const cardDistribution = rawDistribution.map((item) => ({
      name: item.productCode || 'default',
      count: item._count.id,
    }));

    return {
      cardDistribution,
    };
  }
}
