// src/card/interfaces/card.interface.ts
export interface CardListItem {
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
}

export interface CardDetail extends CardListItem {
  currency?: string;
  openDate?: string;
  branch?: string;
  institution?: string;
  clientFullName?: string;
  totalDue?: number;
  pastDue?: number;
}

export interface Way4CardDetailRecord {
  ContractNumber?: string;
  ContractName?: string;
  Status?: string;
  Product?: string;
  Currency?: string;
  CreditLimit?: string | number;
  Available?: string | number;
  TotalDue?: string | number;
  PastDue?: string | number;
  OpenDate?: string;
  Institution?: string;
  Branch?: string;
  ClientFullName?: string;
  EmbossedFirstName?: string;
  EmbossedLastName?: string;
  EmbossedCompanyName?: string;
  ExpirationDate?: string | number;
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
  createdAt: Date;
  productName?: string;
}
