// src/card/interfaces/card-way4.interface.ts

export interface CreateCardParams {
  issuingContractNumber: string;
  productCode: string;
  embossedFirstName: string;
  embossedLastName: string;
  embossedCompanyName?: string;
  cardName?: string;
  cbsNumber?: string;
}

export interface CardContractResponse {
  cardNumber: string;
  expiryDate: string;
  sequenceNumber: string;
}

export interface Way4CardRecord {
  CardNumber?: string;
  CardName?: string;
  EmbossedFirstName?: string;
  EmbossedLastName?: string;
  EmbossedCompanyName?: string;
  Status?: string;
  ExpirationDate?: string | number;
  Product?: string;
  CreditLimit?: string | number;
  Available?: string | number;
}

export interface CreateSupplementaryCardParams {
  clientNumber: string;
  mainContractNumber: string;
  productCode: string;
  cardName: string;
  embossedFirstName: string;
  embossedLastName: string;
}
