import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface GrowthDataItem {
  month: string;
  users: number;
  cards: number;
}
@Injectable()
export class AdminStatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardChartData() {
    // 1. LẤY DỮ LIỆU CƠ CẤU THẺ (PIE CHART)
    // SQL tương đương: SELECT productCode, COUNT(*) FROM Card GROUP BY productCode
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

    // Map lại dữ liệu để FE dễ đọc
    const cardDistribution = rawDistribution.map((item) => ({
      name: item.productCode || 'default',
      count: item._count.id,
    }));

    // 2. LẤY DỮ LIỆU TĂNG TRƯỞNG 6 THÁNG (LINE CHART)
    // Để an toàn không bị lỗi múi giờ hoặc khác biệt hệ quản trị CSDL (Postgres/MySQL),
    // cách clean nhất là tính mốc thời gian 6 tháng bằng JS rồi đếm.
    const growthData: GrowthDataItem[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      // Lùi về i tháng
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
      );

      const monthLabel = `T${startDate.getMonth() + 1}`; // Ra chữ: T3, T4...

      // Chạy 2 query song song (Đếm User mới và Thẻ mới trong tháng đó)
      const [usersCount, cardsCount] = await Promise.all([
        this.prisma.user.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        }),
        this.prisma.card.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        }),
      ]);

      growthData.push({
        month: monthLabel,
        users: usersCount,
        cards: cardsCount,
      });
    }

    // 2. Trả mảng dữ liệu về cho Controller (Code sẽ hết báo lỗi growthData)
    return {
      cardDistribution,
      growthData,
    };
  }
}
