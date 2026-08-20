import { apiPost } from './api';
import { CardCategory } from '../constants/cardCategories';

export interface QuickOpenCardPayload {
  cardCategory: CardCategory;
  embossedFirstName: string;
  embossedLastName: string;
  embossedCompanyName?: string;
  bank?: string;
  account?: string;
  bankCode?: string;
  accName?: string;
  paymentOption?: string;
  cbsNumber?: string;
  institutionCode?: string;
  branch?: string;
}

export interface CardApplicationResponse {
  success: boolean;
  message: string;
  issuingContract?: string;
  cardPan: string;
  expiryDate: string;
}

export function quickOpenCard(
  payload: QuickOpenCardPayload,
): Promise<CardApplicationResponse> {
  return apiPost<CardApplicationResponse, QuickOpenCardPayload>(
    '/contracts/quick-open',
    payload,
  );
}

export interface CreateSupplementaryCardPayload {
  cardName?: string;
  embossedFirstName: string;
  embossedLastName: string;
}

export interface CreateSupplementaryCardPayload {
  cardName?: string;
  embossedFirstName: string;
  embossedLastName: string;
}

// 1. Định nghĩa Interface chuẩn xác thay cho 'any'
export interface SupplementaryCardResponse {
  id: number;
  issuingContractId: number;
  cardNumber: string;
  expiryDate: string | null;
  sequenceNumber: string | null;
  cardName: string | null;
  embossedFirstName: string;
  embossedLastName: string;
  status: string;
  productCode: string;
  createdAt: string;
  updatedAt: string;
}

// 2. Ép kiểu rõ ràng cho Promise và apiPost
export function createSupplementaryCard(
  mainCardNumber: string,
  payload: CreateSupplementaryCardPayload,
): Promise<SupplementaryCardResponse> {
  return apiPost<SupplementaryCardResponse, CreateSupplementaryCardPayload>(
    `/cards/${mainCardNumber}/supplementary`,
    payload,
  );
}