export function formatVnd(value?: number): string {
  if (!value) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
}
