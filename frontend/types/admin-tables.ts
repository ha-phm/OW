import { AdminUser } from './user'; 

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ContractType = 'LIABILITY' | 'ISSUING';

export interface AdminContractItem {
  id: number;
  contractNumber: string;
  contractName: string;
  type: ContractType;
  productCode: string;
  clientNumber: string;
  userEmail: string;
  userIsActive: boolean;
  createdAt: string;
}

export interface AdminCardItem {
  id: number;
  cardNumber: string;
  maskedCardNumber?: string;
  cardName: string;
  embossedFirstName: string;
  embossedLastName: string;
  expiryDate: string | null;
  issuingContractNumber: string;
  userEmail: string;
  clientNumber: string;
  userIsActive: boolean;
  createdAt: string;
  productName: string;
}

// --- CÁC TYPE TRẢ VỀ CÓ PHÂN TRANG (PAGINATED) ---
export type PaginatedAdminContracts = {
  data: AdminContractItem[];
  meta: PaginationMeta;
};

export type PaginatedAdminCards = {
  data: AdminCardItem[];
  meta: PaginationMeta;
};

export type PaginatedAdminUsers = {
  data: AdminUser[];
  meta: PaginationMeta;
};

// ============================================================================
// --- CÁC TYPE PARAMS GỬI LÊN API ---
// ============================================================================

// 1. TẠO TYPE GỐC
export type BaseTableParams = {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  [key: string]: string | number | boolean | undefined; 
};

export type GetAdminContractsParams = BaseTableParams & {
  type?: ContractType; 
};

export type GetAdminUsersParams = BaseTableParams & {
  isActive?: string; 
};

export type GetAdminCardsParams = BaseTableParams;