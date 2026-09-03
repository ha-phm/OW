import { apiGet, apiPatch } from '../api/api';
import { CardListItem, CardDetail, EditCardPayload, PaginatedCards } from '../types/card.types';

export interface CardQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  cardNumber?: string;
  cardName?: string;
  productName?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const cardService = {
  listMine: (paramsObj: CardQueryParams): Promise<PaginatedCards> => {
    const params = new URLSearchParams();
    
    Object.entries(paramsObj).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value).trim());
      }
    });

    return apiGet<PaginatedCards>(`/cards/me?${params.toString()}`);
  },
  
  getDetail: (cardNumber: string): Promise<CardDetail> =>
    apiGet<CardDetail>(`/cards/${encodeURIComponent(cardNumber)}`),
    
  edit: (cardNumber: string, payload: EditCardPayload): Promise<CardListItem> =>
    apiPatch<CardListItem, EditCardPayload>(`/cards/${encodeURIComponent(cardNumber)}`, payload),
};