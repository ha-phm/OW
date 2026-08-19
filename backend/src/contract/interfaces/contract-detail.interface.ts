// dto/get-contract-detail.dto.ts  (FILE MỚI)

export interface GetContractDetailDto {
  contractNumber: string;
  contractName: string;
  status: string;
  statusCode?: string;
  contractCategory?: string; // A;Account -> "A" | C;Card -> "C"
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
}
