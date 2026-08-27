export type CardListItem = {
  cardNumber: string;
  maskedCardNumber?: string;
  cardName: string;
  embossedFirstName: string;
  embossedLastName: string;
  embossedCompanyName?: string;
  status: string;
  expiryDate?: string;
  productName?: string;
  creditLimit?: number;
  available?: number;
  issuingContractNumber: string;
};

export type CardDetail = CardListItem & {
  currency?: string;
  openDate?: string;
  branch?: string;
  institution?: string;
  clientFullName?: string;
  totalDue?: number;
  pastDue?: number;
};

export type EditCardPayload = {
  cardName?: string;
  embossedFirstName?: string;
  embossedLastName?: string;
  embossedCompanyName?: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedCards = {
  data: CardListItem[];
  meta: PaginationMeta;
};
