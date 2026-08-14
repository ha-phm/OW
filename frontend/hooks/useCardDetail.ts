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