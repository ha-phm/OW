import { apiGet, apiPost } from '../api/api';
import { 
  ContractDetail, 
  PaginatedContractTree, 
  ContractResponse, 
  CardApplicationResponse 
} from '../types/contract.types';

export const contractService = {
  
  getDetail: async (contractNumber: string): Promise<ContractDetail> => {
    return await apiGet<ContractDetail>(
      `/contracts/${encodeURIComponent(contractNumber)}`
    );
  },

  getTree: async (search: string, page: number, pageSize: number): Promise<PaginatedContractTree> => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search.trim()) params.set('search', search.trim());

    return apiGet<PaginatedContractTree>(`/contracts/me?${params.toString()}`);
  },

  
  createLiability: async (payload: Record<string, string>): Promise<ContractResponse> => {
    return apiPost<ContractResponse, Record<string, string>>('/contracts', payload);
  },

  
  createIssuing: async (liabilityContractNumber: string, payload: Record<string, string>): Promise<ContractResponse> => {
    return apiPost<ContractResponse, Record<string, string>>(
      `/contracts/${encodeURIComponent(liabilityContractNumber)}/issuing`,
      payload
    );
  },

  
  createCard: async (issuingContractNumber: string, payload: Record<string, string>): Promise<CardApplicationResponse> => {
    return apiPost<CardApplicationResponse, Record<string, string>>(
      `/contracts/${encodeURIComponent(issuingContractNumber)}/cards`,
      payload
    );
  },
};