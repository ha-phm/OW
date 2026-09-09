/**
 * Kiểu dữ liệu chuẩn cho mọi response phân trang trong hệ thống
 * (danh sách thẻ, cây hợp đồng...). Dùng chung thay vì định nghĩa lại
 * `PaginatedResult<T>` ở từng service.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Tạo meta object chuẩn cho response phân trang. */
export function buildMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

