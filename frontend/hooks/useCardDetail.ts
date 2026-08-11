import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cardService } from '../services/card.service';
import { CardDetail, PaginatedCards } from '../types/card.types';
import { CARDS_QUERY_KEY } from './useCards';

export function useCardDetail(cardNumber: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['cardDetail', cardNumber],
    queryFn: () => cardService.getDetail(cardNumber as string),
    enabled: !!cardNumber,
    staleTime: 60 * 1000,
    // Tối ưu UX: nếu đã có item này trong bất kỳ cache danh sách nào (đã
    // load ở trang list), dùng ngay làm initialData -> modal mở ra có nội
    // dung liền, không phải chờ vòng loading, sau đó query vẫn tự refetch
    // ngầm để lấy bản mới nhất từ WAY4 (staleTime 60s).
    initialData: (): CardDetail | undefined => {
      if (!cardNumber) return undefined;
      const queries = queryClient.getQueriesData<PaginatedCards>({
        queryKey: [CARDS_QUERY_KEY],
      });
      for (const [, data] of queries) {
        const found = data?.data.find((c) => c.cardNumber === cardNumber);
        if (found) return { ...found };
      }
      return undefined;
    },
  });
}