export {
  splitWay4Field,
  asRecord,
  toComparableString,
} from '../card/common/way4.util';

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
export const MAX_CARDS_PER_ISSUING =
  CARD_APPLICATION_PRODUCT_CODES.CARDS.length;
