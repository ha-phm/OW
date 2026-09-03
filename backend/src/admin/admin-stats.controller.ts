import { Controller, Get } from '@nestjs/common';
import { AdminStatsService } from './admin-stats.service';

@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly statsService: AdminStatsService) {}

  @Get('charts')
  async getCharts() {
    return this.statsService.getDashboardChartData();
  }
}
