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