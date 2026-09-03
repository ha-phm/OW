const MARITAL_STATUS_MAP: Record<string, 'S' | 'M' | 'D' | 'W'> = {
  '1': 'S', // Single
  '2': 'M', // Married
  '3': 'D', // Divorced
  '4': 'W', // Widowed
};

export function mapMaritalStatusCode(value?: string): 'S' | 'M' | 'D' | 'W' | undefined {
  const code = extractCode(value);
  return MARITAL_STATUS_MAP[code];
}

export function extractText(value?: string): string {
  if (!value) return '';
  const parts = value.split(';');
  return parts.length > 1 ? parts[1].trim() : parts[0].trim();
}

export function extractCode(value?: string): string {
  if (!value) return '';
  return value.split(';')[0].trim();
}