import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/api'; // Trỏ đúng đường dẫn file axios ở trên của bạn

export interface ChartStatsResponse {
  cardDistribution: { name: string; count: number }[];
  growthData: { month: string; users: number; cards: number }[];
}

export const useAdminChartStats = () => {
  return useQuery<ChartStatsResponse>({
    queryKey: ['admin-chart-stats'],
    queryFn: async () => {
      // Dùng thẳng apiGet và truyền type vào. 
      // Hàm này sẽ trả về thẳng cục dữ liệu, không cần .data nữa
      const data = await apiGet<ChartStatsResponse>('/admin/stats/charts');
      return data;
    },
  });
};