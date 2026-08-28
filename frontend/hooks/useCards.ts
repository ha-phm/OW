import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { cardService } from '../services/card.service';

export const CARDS_QUERY_KEY = 'my-cards';

export function useCards(search: string, page: number, pageSize: number = 6) {
  return useQuery({
    queryKey: [CARDS_QUERY_KEY, search, page, pageSize],
    queryFn: () => cardService.listMine(search, page, pageSize),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}