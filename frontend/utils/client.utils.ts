export function extractText(value?: string): string {
  if (!value) return '';
  const parts = value.split(';');
  return parts.length > 1 ? parts[1].trim() : parts[0].trim();
}

export function extractCode(value?: string): string {
  if (!value) return '';
  return value.split(';')[0].trim();
}