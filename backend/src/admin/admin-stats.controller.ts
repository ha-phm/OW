import { Controller, Get } from '@nestjs/common';
import { AdminStatsService } from './admin-stats.service';
// Nhớ import các Guard bảo vệ route Admin của bạn (JwtAuthGuard, RolesGuard...)

@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly statsService: AdminStatsService) {}

  @Get('charts')
  async getCharts() {
    return this.statsService.getDashboardChartData();
  }
}
