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
  createdAt: string;
}

export type PaginatedAdminContracts = {
  data: AdminContractItem[];
  meta: PaginationMeta;
};

export type PaginatedAdminCards = {
  data: AdminCardItem[];
  meta: PaginationMeta;
};

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
