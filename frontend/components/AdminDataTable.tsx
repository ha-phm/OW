'use client';
"use no memo";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdminDataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  emptyMessage?: string;
  showColumnFilters?: boolean;
  // Hai props mới để đồng bộ bộ lọc với Zustand
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
}

export function AdminDataTable<TData>({
  columns,
  data,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
  isFetching,
  emptyMessage = 'Không có dữ liệu.',
  showColumnFilters = true,
  columnFilters = [],
  onColumnFiltersChange,
}: AdminDataTableProps<TData>) {
  
  // Local state để gõ mượt mà (chưa gọi API ngay)
  const [localFilters, setLocalFilters] = useState<ColumnFiltersState>(columnFilters || []);

  // 1. Đồng bộ nếu bộ lọc thay đổi từ bên ngoài (từ Zustand)
  useEffect(() => {
    // Chỉ cập nhật state cục bộ nếu nội dung thực sự khác nhau
    if (JSON.stringify(localFilters) !== JSON.stringify(columnFilters || [])) {
      setLocalFilters(columnFilters || []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(columnFilters)]); // Dùng chuỗi JSON ở dependency để tránh re-render do mảng mới

  // 2. Debounce (Delay 400ms) trước khi đẩy dữ liệu lọc lên Store để gọi API
  useEffect(() => {
    const timer = setTimeout(() => {
      // Chỉ bắn lên Store (gọi API) nếu người dùng vừa thực sự thay đổi ô lọc
      if (JSON.stringify(localFilters) !== JSON.stringify(columnFilters || [])) {
        onColumnFiltersChange?.(localFilters);
      }
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFilters, onColumnFiltersChange]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true, // QUAN TRỌNG: Bật cờ này để báo TanStack biết Server sẽ lo việc lọc
    pageCount: totalPages,
    state: {
      columnFilters: localFilters,
    },
    onColumnFiltersChange: setLocalFilters,
  });

  const [jumpPage, setJumpPage] = useState(page.toString());

  useEffect(() => {
    setJumpPage(page.toString());
  }, [page]);

  const handleJumpPage = (val: string) => {
    const num = Number(val);
    if (num >= 1 && num <= totalPages) {
      onPageChange(num);
    } else {
      setJumpPage(page.toString()); 
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* KHU VỰC BẢNG DỮ LIỆU */}
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5 transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-linear-to-r from-emerald-50/80 to-teal-50/80 border-b border-emerald-100/80">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-5 py-4 align-top text-xs font-bold uppercase tracking-wider text-teal-800"
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex flex-col gap-2.5">
                          {/* Tiêu đề cột */}
                          <div className="flex items-center gap-1.5">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </div>
                          
                          {/* Ô input Lọc theo cột */}
                          {showColumnFilters && header.column.getCanFilter() && (
                            <div className="relative flex items-center mt-1">
                              <Filter className="absolute left-2 h-3 w-3 text-emerald-400" />
                              <input
                                type="text"
                                value={(header.column.getFilterValue() ?? '') as string}
                                onChange={e => header.column.setFilterValue(e.target.value)}
                                placeholder="Lọc..."
                                className="w-full rounded-lg border border-emerald-200/60 bg-white/80 py-1.5 pl-6 pr-2 text-xs font-normal text-slate-700 outline-none transition-colors placeholder:text-emerald-300 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-emerald-50/50">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-emerald-600">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
                      <span className="text-sm font-medium">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Filter className="h-10 w-10 mb-2 opacity-20" />
                      <span className="text-sm">{emptyMessage}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr 
                    key={row.id} 
                    className="group bg-white hover:bg-emerald-50/40 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5 text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KHU VỰC ĐIỀU KHIỂN PHÂN TRANG */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
        
        {/* Chọn số dòng hiển thị */}
        <div className="flex items-center gap-2 pl-2">
          <span className="font-medium text-slate-500">Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-emerald-100 bg-emerald-50/30 px-3 py-1.5 font-semibold text-emerald-700 outline-none transition-all hover:bg-emerald-100/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 cursor-pointer"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-slate-500">dòng / trang</span>
        </div>

        {/* Thông tin kết quả & Nhảy trang */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Tổng cộng:</span>
            <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {total}
            </strong>
            <span className="text-slate-500">kết quả {isFetching && '(Đang cập nhật...)'}</span>
          </div>
          
          <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
            <span className="text-slate-500 font-medium">Trang:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage} 
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJumpPage(jumpPage);
              }}
              onBlur={() => handleJumpPage(jumpPage)}
              className="w-14 rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-center font-semibold text-emerald-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
            <span className="text-slate-400">/ {totalPages}</span>
          </div>
        </div>

        {/* Nút Next/Prev */}
        <div className="flex items-center gap-1.5 pr-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 hover:border-emerald-300 disabled:border-slate-100 disabled:text-slate-300 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 hover:border-emerald-300 disabled:border-slate-100 disabled:text-slate-300 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}