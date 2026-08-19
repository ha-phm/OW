export enum CardCategory {
  TRAVEL = 'TRAVEL',
  ECOMMERCE = 'ECOMMERCE',
  VISA = 'VISA',
  CREDIT = 'CREDIT',
}

export const CARD_CATEGORY_LABEL: Record<CardCategory, string> = {
  [CardCategory.TRAVEL]: 'Du lịch',
  [CardCategory.ECOMMERCE]: 'Thương mại điện tử',
  [CardCategory.VISA]: 'Thẻ Visa',
  [CardCategory.CREDIT]: 'Thẻ Credit',
};