import { apiGet, apiPatch } from '../api/api';
import { CardListItem, CardDetail, EditCardPayload, PaginatedCards } from '../types/card.types';

export const cardService = {
  listMine: (search: string, page: number, pageSize: number): Promise<PaginatedCards> => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search.trim()) params.set('search', search.trim());
    return apiGet<PaginatedCards>(`/cards/me?${params.toString()}`);
  },
  getDetail: (cardNumber: string): Promise<CardDetail> =>
    apiGet<CardDetail>(`/cards/${encodeURIComponent(cardNumber)}`),
  edit: (cardNumber: string, payload: EditCardPayload): Promise<CardListItem> =>
    apiPatch<CardListItem, EditCardPayload>(`/cards/${encodeURIComponent(cardNumber)}`, payload),
};