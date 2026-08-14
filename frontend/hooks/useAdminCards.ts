import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { GetAdminCardsParams } from '@/types/admin-tables';

export function useAdminCards(params: GetAdminCardsParams) {
  return useQuery({
    queryKey: ['admin', 'cards', params],
    queryFn: () => adminService.listCards(params),
    placeholderData: keepPreviousData,
  });
}
