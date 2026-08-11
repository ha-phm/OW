import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { contractService } from '../services/contract.service';

export const CONTRACTS_QUERY_KEY = 'contracts-tree';
const PAGE_SIZE = 2; 

export function useContractsTree(search: string, page: number) {
  return useQuery({
    queryKey: [CONTRACTS_QUERY_KEY, search, page],
    queryFn: () => contractService.getTree(search, page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });
}