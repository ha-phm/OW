import { AdminUser } from './user'; // Bổ sung import này

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

// 👇 BỔ SUNG TYPE NÀY CHO USER
export type PaginatedAdminUsers = {
  data: AdminUser[];
  meta: PaginationMeta;
};


// --- CÁC TYPE PARAMS GỬI LÊN API ---
export type GetAdminContractsParams = {
  search?: string;
  type?: ContractType;
  page: number;
  pageSize: number;
  filters?: Record<string, string>;
};

export type GetAdminCardsParams = {
  search?: string;
  page: number;
  pageSize: number;
  filters?: Record<string, string>;
};

// 👇 CHUYỂN TYPE NÀY TỪ BÊN FILE USER SANG ĐÂY
export type GetAdminUsersParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}