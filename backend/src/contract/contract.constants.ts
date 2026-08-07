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

export function splitWay4Field(value?: string | null): {
  code: string;
  label: string;
} {
  if (!value) return { code: '', label: '' };
  const [code, ...rest] = String(value).split(';');
  return { code, label: rest.join(';') || code };
}
