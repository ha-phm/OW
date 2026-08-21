import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { GetAdminContractsParams } from '@/types/admin-tables';

export function useAdminContracts(params: GetAdminContractsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin', 'contracts', params],
    queryFn: () => adminService.listContracts(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled, // Bổ sung cờ enabled
  });
}
