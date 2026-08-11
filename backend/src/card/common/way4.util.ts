export function splitWay4Field(value?: string | null): {
  code: string;
  label: string;
} {
  if (!value) return { code: '', label: '' };
  const [code, ...rest] = String(value).split(';');
  return { code, label: rest.join(';') || code };
}

/**
 * SOAP client trả về dữ liệu không có type tĩnh, coi là unknown và thu hẹp
 * kiểu bằng type-guard này thay vì dùng `any`.
 */
export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * Chỉ cho phép stringify khi giá trị chắc chắn là string hoặc number.
 * Tránh cảnh báo no-base-to-string vì `unknown` có thể là object lồng nhau,
 * và tránh lỗi logic ngầm khi so sánh "[object Object]" với giá trị mong đợi.
 */
export function toComparableString(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : undefined;
}
