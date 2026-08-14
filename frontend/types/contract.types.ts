
export type ContractTreeCard = {
  contractNumber: string;
  contractName: string;
  status: string;
  productCode: string;
};

export type ContractTreeIssuing = {
  contractNumber: string;
  contractName: string;
  status: string;
  productCode: string;
  creditLimit: number;
  balance: number;
  cards: ContractTreeCard[];
};

export type ContractTreeLiability = {
  contractNumber: string;
  contractName: string;
  status: string;
  productCode: string;
  openDate: string;
  issuings: ContractTreeIssuing[];
};

export type ContractResponse = {
  success: boolean;
  contractNumber?: string;
  applicationNumber?: string;
};

export type CardApplicationResponse = {
  success: boolean;
  message: string;
  issuingContract?: string;
  cardPan: string;
  expiryDate: string;
};


export type ContractDetail = {
  contractNumber: string;
  contractName: string;
  status: string;
  statusCode?: string;
  contractCategory?: string; 
  productCode?: string;
  productName?: string;
  currency?: string;
  creditLimit?: number;
  available?: number;
  balance?: number;
  totalDue?: number;
  pastDue?: number;
  pastDueDays?: number;
  openDate?: string;
  lastBillingDate?: string;
  nextBillingDate?: string;
  institution?: string;
  branch?: string;
  clientFullName?: string;
  parentContract?: string;
  topContract?: string;
};

export const MAX_CARDS_PER_ISSUING = 4;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedContractTree = {
  data: ContractTreeLiability[];
  meta: PaginationMeta;
};