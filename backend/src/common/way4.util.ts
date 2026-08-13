export { asRecord, toComparableString } from './utils/way4-response.util';

export function splitWay4Field(value?: string | null): {
  code: string;
  label: string;
} {
  if (!value) return { code: '', label: '' };
  const [code, ...rest] = String(value).split(';');
  return { code, label: rest.join(';') || code };
}
