'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiGet, ApiError } from '../api/api';
import { ContractDetail } from '../types/contract.types';
import { formatVnd } from '../utils/format';

/**
 * Hiển thị thông tin chi tiết của MỘT hợp đồng (Liability / Issuing / Card).
 * Chỉ gọi API khi người dùng thực sự mở rộng dòng đó (lazy load),
 * và cache lại trong state của component cha (xem `detailCache` ở ContractsPage)
 * để không gọi lại API mỗi lần đóng/mở.
 *
 * Yêu cầu backend: GET /contracts/:contractNumber  (xem backend/ đính kèm)
 */
export function ContractDetailPanel({
  contractNumber,
  cachedDetail,
  onLoaded,
}: {
  contractNumber: string;
  cachedDetail?: ContractDetail;
  onLoaded: (detail: ContractDetail) => void;
}) {
  // isFetching chỉ phản ánh việc GỌI API, không phản ánh việc "có dữ liệu để hiển thị hay không".
  // Khi render, ta kết hợp isFetching với cachedDetail (xem showLoading bên dưới) thay vì set
  // state trực tiếp trong nhánh "đã có cache" của effect — tránh setState đồng bộ trong effect.
  const [isFetching, setIsFetching] = useState(!cachedDetail);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedDetail) {
      // Đã có dữ liệu (từ cache của component cha) — không cần gọi API, và không cần
      // setState ở đây: showLoading bên dưới đã tự tắt vì kết hợp với cachedDetail.
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setIsFetching(true);
        setError(null);
        const data = await apiGet<ContractDetail>(
          `/contracts/${encodeURIComponent(contractNumber)}`,
        );
        if (!cancelled) onLoaded(data);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof ApiError ? err.message : 'Không thể tải chi tiết hợp đồng.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractNumber, cachedDetail]);

  const showLoading = isFetching && !cachedDetail;

  if (showLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Đang tải chi tiết…
      </div>
    );
  }

  if (error && !cachedDetail) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        {error}
      </div>
    );
  }

  if (!cachedDetail) return null;

  type DetailRow = { label: string; value: string };

  const candidateRows: Array<{ label: string; value?: string }> = [
    { label: 'Sản phẩm', value: cachedDetail.productName || cachedDetail.productCode },
    {
      label: 'Hạn mức',
      value: cachedDetail.creditLimit != null ? formatVnd(cachedDetail.creditLimit) : undefined,
    },
    {
      label: 'Khả dụng',
      value: cachedDetail.available != null ? formatVnd(cachedDetail.available) : undefined,
    },
    {
      label: 'Dư nợ',
      value: cachedDetail.balance != null ? formatVnd(cachedDetail.balance) : undefined,
    },
    {
      label: 'Tổng nợ đến hạn',
      value: cachedDetail.totalDue != null ? formatVnd(cachedDetail.totalDue) : undefined,
    },
    {
      label: 'Nợ quá hạn',
      value: cachedDetail.pastDue != null ? formatVnd(cachedDetail.pastDue) : undefined,
    },
    { label: 'Ngày mở', value: cachedDetail.openDate },
    { label: 'Kỳ sao kê gần nhất', value: cachedDetail.lastBillingDate },
    { label: 'Kỳ sao kê kế tiếp', value: cachedDetail.nextBillingDate },
    { label: 'Chi nhánh', value: cachedDetail.branch },
    { label: 'Khách hàng', value: cachedDetail.clientFullName },
    { label: 'Hợp đồng cha', value: cachedDetail.parentContract },
  ];

  const rows: DetailRow[] = candidateRows.filter(
    (row): row is DetailRow => Boolean(row.value),
  );

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg bg-slate-50 p-4 text-xs sm:grid-cols-3">
      {rows.map((row) => (
        <div key={row.label}>
          <span className="block text-slate-400">{row.label}</span>
          <span className="font-medium text-slate-700">{row.value}</span>
        </div>
      ))}
    </div>
  );
}