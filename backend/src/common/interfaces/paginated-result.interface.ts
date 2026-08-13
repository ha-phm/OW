/**
 * Kiểu dữ liệu chuẩn cho mọi response phân trang trong hệ thống
 * (danh sách thẻ, cây hợp đồng...). Dùng chung thay vì định nghĩa lại
 * `PaginatedResult<T>` ở từng service.
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
