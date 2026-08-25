import { create } from 'zustand';
import { ContractType } from '../types/admin-tables';
import { ColumnFiltersState } from '@tanstack/react-table'; // Import thêm

interface TableParams {
  search: string;
  page: number;
  pageSize: number;
  columnFilters: ColumnFiltersState; // Thêm biến lưu bộ lọc cột
}

interface AdminState {
  activeTab: 'USERS' | 'CONTRACTS' | 'CARDS';
  setActiveTab: (tab: 'USERS' | 'CONTRACTS' | 'CARDS') => void;
  
  contractsParams: TableParams & { type: ContractType | '' };
  cardsParams: TableParams;
  usersParams: TableParams; 

  setContractsParams: (params: Partial<TableParams & { type: ContractType | '' }>) => void;
  setCardsParams: (params: Partial<TableParams>) => void;
  setUsersParams: (params: Partial<TableParams>) => void;
}

const defaultParams: TableParams = { search: '', page: 1, pageSize: 10, columnFilters: [] };

export const useAdminStore = create<AdminState>((set) => ({
  activeTab: 'USERS',
  setActiveTab: (tab) => set({ activeTab: tab }),

  contractsParams: { ...defaultParams, type: '' },
  cardsParams: { ...defaultParams },
  usersParams: { ...defaultParams },

  setContractsParams: (newParams) => 
    set((state) => ({
      contractsParams: { 
        ...state.contractsParams, 
        ...newParams, 
        page: (newParams.search !== undefined || newParams.type !== undefined || newParams.columnFilters !== undefined) ? 1 : (newParams.page ?? state.contractsParams.page) 
      }
    })),
    
  setCardsParams: (newParams) => 
    set((state) => ({
      cardsParams: { 
        ...state.cardsParams, 
        ...newParams,
        page: (newParams.search !== undefined || newParams.columnFilters !== undefined) ? 1 : (newParams.page ?? state.cardsParams.page)
      }
    })),
    
  setUsersParams: (newParams) => 
    set((state) => ({
      usersParams: { ...state.usersParams, ...newParams }
    })),
}));