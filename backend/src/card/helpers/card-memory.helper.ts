// src/card/helpers/card-memory.helper.ts
import { CardListItem } from '../interfaces/card.interface';
import { GetCardsQueryDto } from '../dto/get-cards-query.dto';

export function filterCardsInMemory(
  items: CardListItem[],
  query: GetCardsQueryDto,
): CardListItem[] {
  let filtered = items;

  // Lọc bằng thanh Tìm kiếm tổng hợp
  if (query.search) {
    const q = query.search.trim().toLowerCase();
    const matches = (s?: string): boolean =>
      (s ?? '').toLowerCase().includes(q);
    filtered = filtered.filter(
      (c: CardListItem) =>
        matches(c.cardNumber) ||
        matches(c.cardName) ||
        matches(c.embossedFirstName) ||
        matches(c.embossedLastName),
    );
  }

  // Lọc theo cột: Số thẻ
  if (query.cardNumber) {
    const q = query.cardNumber.trim().toLowerCase();
    filtered = filtered.filter((c: CardListItem) =>
      (c.cardNumber || '').toLowerCase().includes(q),
    );
  }

  // Lọc theo cột: Tên thẻ
  if (query.cardName) {
    const q = query.cardName.trim().toLowerCase();
    filtered = filtered.filter((c: CardListItem) =>
      (c.cardName || '').toLowerCase().includes(q),
    );
  }

  if (query.productName) {
    const q = query.productName.trim().toLowerCase();
    filtered = filtered.filter((c: CardListItem) =>
      (c.productName || '').toLowerCase().includes(q),
    );
  }

  return filtered;
}

export function sortCardsInMemory(
  items: CardListItem[],
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
): CardListItem[] {
  if (!sortBy) return items;
  return [...items].sort((a, b) => {
    const valA = a[sortBy as keyof CardListItem];
    const valB = b[sortBy as keyof CardListItem];
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    const isDesc = sortOrder === 'desc';
    if (valA < valB) return isDesc ? 1 : -1;
    return isDesc ? -1 : 1;
  });
}
