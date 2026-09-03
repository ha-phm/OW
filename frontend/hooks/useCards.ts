import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { cardService, CardQueryParams } from '../services/card.service';

export const CARDS_QUERY_KEY = 'my-cards';

export function useCards(params: CardQueryParams) {
  return useQuery({
    queryKey: [CARDS_QUERY_KEY, params],
    queryFn: () => cardService.listMine(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}