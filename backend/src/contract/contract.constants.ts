export {
  splitWay4Field,
  asRecord,
  toComparableString,
} from '../common/way4.util';

export const CARD_APPLICATION_PRODUCT_CODES = {
  LIABILITY: 'LIAB_TRAINING01',
  ISSUING: 'ISSUING_TRAINING01',
  CARDS: [
    'CARD_TRAINING01',
    'CARD_TRAINING02',
    'CARD_TRAINING03',
    'CARD_TRAINING04',
  ] as const,
};

export enum CardCategory {
  TRAVEL = 'TRAVEL',
  ECOMMERCE = 'ECOMMERCE',
  VISA = 'VISA',
  CREDIT = 'CREDIT',
}

export const CARD_CATEGORY_PRODUCT_CODE: Record<CardCategory, string> = {
  [CardCategory.TRAVEL]: 'CARD_TRAINING01',
  [CardCategory.ECOMMERCE]: 'CARD_TRAINING02',
  [CardCategory.VISA]: 'CARD_TRAINING03',
  [CardCategory.CREDIT]: 'CARD_TRAINING04',
};

export const CARD_CATEGORY_LABEL: Record<CardCategory, string> = {
  [CardCategory.TRAVEL]: 'Du lịch',
  [CardCategory.ECOMMERCE]: 'Thương mại điện tử',
  [CardCategory.VISA]: 'Thẻ Visa',
  [CardCategory.CREDIT]: 'Thẻ Credit',
};

export const MAX_CARDS_PER_ISSUING = Object.keys(CardCategory).length; // = 4
