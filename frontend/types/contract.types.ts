// ==========================================
// TYPES — khớp với ContractTreeLiability / Issuing / Card ở backend
// ==========================================

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

// ==========================================
// Chi tiết 1 hợp đồng (dùng khi "mở rộng" 1 dòng trong cây)
// Field map theo IssContractDetailsAPIOutputV2Record của WAY4 (GetContractV2)
// ==========================================
export type ContractDetail = {
  contractNumber: string;
  contractName: string;
  status: string;
  statusCode?: string;
  contractCategory?: string; // Liability / Issuing / Card
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

// ==========================================
// Giới hạn số thẻ tối đa cho mỗi hợp đồng phát hành (Issuing)
// Phải khớp với MAX_CARDS_PER_ISSUING bên backend (contract.constants.ts)
// ==========================================
export const MAX_CARDS_PER_ISSUING = 4;

// ==========================================
// Response phân trang cho GET /contracts/me?search=&page=&pageSize=
// Khớp với PaginatedResult<ContractTreeLiability> ở contract.service.ts
// ==========================================
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