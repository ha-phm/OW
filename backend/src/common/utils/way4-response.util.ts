import { Logger } from '@nestjs/common';

/**
 * Helper dùng chung để parse response từ WAY4 (SOAP), vốn không có kiểu
 * tĩnh (`unknown`) sau khi đi qua fast-xml-parser. Toàn bộ service liên
 * quan tới WAY4 (CardService, ContractService, ClientService...) nên
 * import từ đây thay vì tự định nghĩa lại các hàm type-guard này.
 */

const logger = new Logger('Way4ResponseUtil');

/** Giá trị nguyên thuỷ mà WAY4 có thể trả về cho một field. */
type PrimitiveValue = string | number | boolean;

function isPrimitive(value: unknown): value is PrimitiveValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/**
 * Thu hẹp `unknown` thành `Record<string, unknown>` một cách an toàn.
 * Dùng khi cần đọc field lồng nhau trong envelope SOAP mà không chắc
 * chắn hình dạng (ví dụ: `envelope.SomeMethodResult`).
 */
export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * Chỉ cho phép stringify khi giá trị chắc chắn là string hoặc number.
 * Tránh cảnh báo `no-base-to-string` (vì `unknown` có thể là object
 * lồng nhau, và `String({})` sẽ ra `"[object Object]"` một cách âm
 * thầm), đồng thời tránh lỗi logic ngầm khi so sánh chuỗi đó với giá
 * trị mong đợi (ví dụ `retCode !== '0'` luôn đúng một cách sai lệch).
 *
 * Khác với `toStringOrUndefined`, hàm này KHÔNG chấp nhận `boolean` —
 * chỉ dùng cho các field mang tính "mã số" như RetCode, ContractNumber.
 */
export function toComparableString(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : undefined;
}

/**
 * Stringify an toàn cho các field hiển thị chung (chấp nhận cả
 * boolean). Nếu gặp object không mong đợi, log cảnh báo thay vì
 * stringify mù quáng thành "[object Object]" hoặc throw, để không làm
 * gãy luồng chính khi WAY4 trả về hình dạng lạ.
 */
export function toStringOrUndefined(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (isPrimitive(value)) return String(value);

  logger.warn(
    `toStringOrUndefined nhận giá trị không phải primitive: ${JSON.stringify(value)}`,
  );
  return undefined;
}

/** Giống `toStringOrUndefined` nhưng trả `null` — tiện cho Prisma field nullable. */
export function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (isPrimitive(value)) return String(value);

  logger.warn(
    `toStringOrNull nhận giá trị không phải primitive: ${JSON.stringify(value)}`,
  );
  return null;
}

/** Parse an toàn sang number; trả `undefined` nếu rỗng hoặc không hợp lệ (NaN). */
export function toNumberOrUndefined(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Kiểm tra RetCode chuẩn của WAY4 (RetCode === '0' nghĩa là thành
 * công). Ném lỗi với message lấy từ RetMsg nếu có, hoặc fallback nếu
 * không.
 *
 * Lưu ý: hàm này CHỈ ném `Error` thuần — nơi gọi (service layer) chịu
 * trách nhiệm bọc lại thành exception phù hợp của Nest (ví dụ
 * `InternalServerErrorException`), vì `common/` không nên phụ thuộc
 * ngược vào tầng HTTP.
 */
export function assertWay4Success(
  data: Record<string, unknown>,
  fallbackMessage: string,
): void {
  const retCode = toComparableString(data.RetCode);
  if (retCode === undefined || retCode !== '0') {
    const message =
      typeof data.RetMsg === 'string' ? data.RetMsg : fallbackMessage;
    throw new Error(message);
  }
}
