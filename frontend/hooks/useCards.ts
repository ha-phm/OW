import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { cardService } from '../services/card.service';

export const CARDS_QUERY_KEY = 'my-cards';
const PAGE_SIZE = 3;

export function useCards(search: string, page: number) {
  return useQuery({
    queryKey: [CARDS_QUERY_KEY, search, page],
    queryFn: () => cardService.listMine(search, page, PAGE_SIZE),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}