'use client';

import { Loader2, AlertCircle } from 'lucide-react';
import { useContractDetail } from '../hooks/useContractDetail';
import { ApiError } from '../api/api';
import { formatVnd } from '../utils/format';

export function ContractDetailPanel({
  contractNumber,
}: {
  contractNumber: string;
}) {
  // Code component bây giờ cực kỳ "sạch", chỉ tập trung vào UI
  const { data, isLoading, error } = useContractDetail(contractNumber);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Đang tải chi tiết…
      </div>
    );
  }

  if (error) {
    const msg = error instanceof ApiError ? error.message : 'Không thể tải chi tiết hợp đồng.';
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        {msg}
      </div>
    );
  }

  // Chặn trường hợp fetch xong nhưng không có dữ liệu
  if (!data) return null;

  // --- Khúc dưới này là logic hiển thị UI (giữ nguyên) ---
  type DetailRow = { label: string; value: string };

  const candidateRows: Array<{ label: string; value?: string }> = [
    { label: 'Sản phẩm', value: data.productName || data.productCode },
    { label: 'Hạn mức', value: data.creditLimit != null ? formatVnd(data.creditLimit) : undefined },
    { label: 'Khả dụng', value: data.available != null ? formatVnd(data.available) : undefined },
    { label: 'Dư nợ', value: data.balance != null ? formatVnd(data.balance) : undefined },
    { label: 'Tổng nợ đến hạn', value: data.totalDue != null ? formatVnd(data.totalDue) : undefined },
    { label: 'Nợ quá hạn', value: data.pastDue != null ? formatVnd(data.pastDue) : undefined },
    { label: 'Ngày mở', value: data.openDate },
    { label: 'Kỳ sao kê gần nhất', value: data.lastBillingDate },
    { label: 'Kỳ sao kê kế tiếp', value: data.nextBillingDate },
    { label: 'Chi nhánh', value: data.branch },
    { label: 'Khách hàng', value: data.clientFullName },
    { label: 'Hợp đồng cha', value: data.parentContract },
  ];

  // Lọc bỏ những dòng không có dữ liệu
  const rows: DetailRow[] = candidateRows.filter(
    (row): row is DetailRow => Boolean(row.value)
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