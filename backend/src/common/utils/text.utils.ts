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

/**
 * Che số thẻ theo chuẩn PCI-DSS (giữ lại 6 số đầu BIN và 4 số cuối, hoặc chỉ 4 số cuối).
 * @param cardNumber Số thẻ (PAN)
 * @param format 'bin' (mặc định: 9704 12** **** 1234) hoặc 'last4' (•••• •••• •••• 1234)
 */
export function maskCardNumber(
  cardNumber?: string | null,
  format: 'bin' | 'last4' = 'bin',
): string {
  if (!cardNumber) return '';
  const clean = cardNumber.replace(/\s+/g, '');
  if (clean.length < 8) return clean;

  if (format === 'last4') {
    const last4 = clean.slice(-4);
    const masked = '•'.repeat(Math.max(0, clean.length - 4)) + last4;
    return masked.replace(/(.{4})/g, '$1 ').trim();
  }

  // Format BIN: Giữ 6 số đầu, 4 số cuối
  const first6 = clean.slice(0, 6);
  const last4 = clean.slice(-4);
  const maskedLength = Math.max(0, clean.length - 10);
  const masked = first6 + '*'.repeat(maskedLength) + last4;

  return masked.replace(/(.{4})/g, '$1 ').trim();
}

