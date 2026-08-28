export function formatVnd(value?: number): string {
  if (!value) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
}

/**
 * Che số thẻ theo chuẩn PCI-DSS
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
    const masked = '••••••••••••' + last4;
    return masked.slice(-16).replace(/(.{4})/g, '$1 ').trim();
  }

  const first6 = clean.slice(0, 6);
  const last4 = clean.slice(-4);
  const maskedLength = Math.max(0, clean.length - 10);
  const masked = first6 + '*'.repeat(maskedLength) + last4;

  return masked.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Chia số thẻ thành 4 cụm (phục vụ hiển thị trên giao diện thẻ ảo)
 * @param cardNumber Số thẻ
 * @param revealFull Hiển thị đầy đủ số (true) hoặc che bằng dấu chấm tròn (false)
 */
export function formatCardNumberGroups(cardNumber?: string, revealFull = false): string[] {
  if (!cardNumber || cardNumber.length < 4) return ['••••', '••••', '••••', '????'];

  if (revealFull) {
    const clean = cardNumber.replace(/\s+/g, '');
    const padded = clean.padStart(Math.ceil(clean.length / 4) * 4, '0');
    const groups: string[] = [];
    for (let i = 0; i < padded.length; i += 4) {
      groups.push(padded.slice(i, i + 4));
    }
    return groups;
  }

  const clean = cardNumber.replace(/\s+/g, '');
  const last4 = clean.slice(-4);
  return ['••••', '••••', '••••', last4];
}

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu và viết hoa toàn bộ
 * Phục vụ cho việc in nổi tên trên thẻ (Embossed Name) chuẩn quốc tế
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD') // Tách các ký tự dấu ra khỏi chữ cái gốc
    .replace(/[\u0300-\u036f]/g, '') // Xóa các dấu thanh
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase(); // Luôn viết hoa chuẩn thẻ thanh toán
}