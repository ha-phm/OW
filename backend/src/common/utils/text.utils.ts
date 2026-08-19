export function toEmbossingSafeName(value?: string | null): string {
  if (!value) return '';

  const withoutDiacritics = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu thanh (á, à, ả, ã, ạ...)
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  return withoutDiacritics
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '') // bỏ mọi ký tự còn sót lại ngoài A-Z, số, space
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 26); // giới hạn độ dài dòng dập nổi — chỉnh lại nếu WAY4 quy định khác
}
