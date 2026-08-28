export enum CardCategory {
  TRAVEL = 'TRAVEL',
  ECOMMERCE = 'ECOMMERCE',
  VISA = 'VISA',
  CREDIT = 'CREDIT',
}

export const CARD_CATEGORY_LABEL: Record<CardCategory, string> = {
  [CardCategory.TRAVEL]: 'TRAVEL',
  [CardCategory.ECOMMERCE]: 'ECOMMERCE',
  [CardCategory.VISA]: 'VISA',
  [CardCategory.CREDIT]: 'CREDIT',
};

const BACKEND_PRODUCT_MAP: Record<string, string> = {
  '001-Training Card Product 01': CARD_CATEGORY_LABEL[CardCategory.TRAVEL],
  '001-Training Card Product 02': CARD_CATEGORY_LABEL[CardCategory.ECOMMERCE],
  '001-Training Card Product 03': CARD_CATEGORY_LABEL[CardCategory.VISA],
  '001-Training Card Product 04': CARD_CATEGORY_LABEL[CardCategory.CREDIT],
};


export function formatCardProductLabel(rawProductName?: string | null): string {
  if (!rawProductName || rawProductName === 'default') {
    return 'Thẻ thanh toán';
  }
  
  if (BACKEND_PRODUCT_MAP[rawProductName]) {
    return BACKEND_PRODUCT_MAP[rawProductName];
  }

  if (CARD_CATEGORY_LABEL[rawProductName as CardCategory]) {
    return CARD_CATEGORY_LABEL[rawProductName as CardCategory];
  }

  return rawProductName; 
}