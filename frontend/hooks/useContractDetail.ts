import { useQuery } from '@tanstack/react-query';
import { contractService } from '../services/contract.service';

export function useContractDetail(contractNumber: string) {
  return useQuery({
    queryKey: ['contractDetail', contractNumber], 
    queryFn: () => contractService.getDetail(contractNumber), 
    staleTime: 5 * 60 * 1000, 
  });
}