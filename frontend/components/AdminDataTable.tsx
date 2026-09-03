'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  useTable,
  tableFeatures,
  columnFilteringFeature,
  rowSortingFeature,
  type RowData,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

// V9: bạn phải khai báo tường minh những "feature" mà bảng sẽ dùng.
// Ở đây ta cần: lọc theo cột (columnFilteringFeature) + sắp xếp (rowSortingFeature).
// getCoreRowModel không cần khai báo nữa - v9 tự động có sẵn.
// Đang dùng manualFiltering/manualSorting (server xử lý), ta không cần
// filteredRowModel/sortedRowModel - chỉ cần feature để có state + API (setFilterValue,
// toggleSorting, getIsSorted, ...).

export const tableFeatureSet = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
});

export type AppFeatures = typeof tableFeatureSet;

interface AdminDataTableProps<TData extends RowData> {
  columns: ColumnDef<AppFeatures, TData, unknown>[];
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
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  // Mới: sort do server xử lý (manualSorting). Nếu không truyền, bảng vẫn
  // hoạt động nhưng click header sẽ không có tác dụng ra ngoài.
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
}

export function AdminDataTable<TData extends RowData>({
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
  sorting = [],
  onSortingChange,
}: AdminDataTableProps<TData>) {
  const [localFilters, setLocalFilters] =
    useState<ColumnFiltersState>(columnFilters || []);
  const [jumpPage, setJumpPage] = useState(page.toString());

  const propFiltersString = JSON.stringify(columnFilters || []);
  const localFiltersString = JSON.stringify(localFilters);

  // Đồng bộ localFilters khi prop columnFilters đổi từ bên ngoài (ví dụ bị reset).
  // KHÔNG dùng useEffect + setState ở đây (React khuyến cáo "Avoid calling setState()
  // directly within an effect" vì gây thêm 1 lượt render). Thay vào đó "điều chỉnh state
  // ngay trong lúc render" bằng cách theo dõi giá trị prop đã đồng bộ gần nhất.
  const [syncedPropFiltersString, setSyncedPropFiltersString] =
    useState(propFiltersString);
  if (propFiltersString !== syncedPropFiltersString) {
    setSyncedPropFiltersString(propFiltersString);
    setLocalFilters(JSON.parse(propFiltersString));
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localFiltersString !== propFiltersString) {
        onColumnFiltersChange?.(JSON.parse(localFiltersString));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localFiltersString, propFiltersString, onColumnFiltersChange]);

  const tableData = useMemo(() => data, [data]);
  const tableColumns = useMemo(() => columns, [columns]);

  // ------------------------------------------------------------------
  // V9: useReactTable -> useTable, thêm `features`.
  // Sorting được điều khiển từ ngoài (controlled) qua props sorting/onSortingChange,
  // giống hệt cách columnFilters đang được điều khiển - vì dữ liệu phân trang
  // ở server nên sort cũng cần server xử lý (manualSorting: true).
  // ------------------------------------------------------------------
  const table = useTable({
    features: tableFeatureSet,
    data: tableData,
    columns: tableColumns,
    manualFiltering: true,
    manualSorting: true,
    state: {
      columnFilters: localFilters,
      sorting,
    },
    onColumnFiltersChange: setLocalFilters,
    onSortingChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange?.(next);
    },
  });

  // Đồng bộ ô "jump to page" khi `page` đổi từ bên ngoài (nút prev/next, đổi pageSize...),
  // cùng lý do nêu trên - điều chỉnh state trong lúc render thay vì trong useEffect.
  const [syncedPage, setSyncedPage] = useState(page);
  if (page !== syncedPage) {
    setSyncedPage(page);
    setJumpPage(page.toString());
  }

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
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5 transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-linear-to-r from-emerald-50/80 to-teal-50/80 border-b border-emerald-100/80">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDir = header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        className="px-5 py-4 align-top text-xs font-bold uppercase tracking-wider text-teal-800"
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex flex-col gap-2.5">
                            <div
                              className={`flex items-center gap-1.5 ${
                                canSort ? 'cursor-pointer select-none group/sort' : ''
                              }`}
                              onClick={
                                canSort
                                  ? header.column.getToggleSortingHandler()
                                  : undefined
                              }
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {canSort && (
                                <span className="text-emerald-500/70 group-hover/sort:text-emerald-600">
                                  {sortDir === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  ) : sortDir === 'desc' ? (
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                                  )}
                                </span>
                              )}
                            </div>

                            {showColumnFilters && header.column.getCanFilter() && (
                              <div className="relative flex items-center mt-1">
                                <Filter className="absolute left-2 h-3 w-3 text-emerald-400" />
                                <input
                                  type="text"
                                  value={(header.column.getFilterValue() ?? '') as string}
                                  onChange={(e) => header.column.setFilterValue(e.target.value)}
                                  placeholder="Lọc..."
                                  className="w-full rounded-lg border border-emerald-200/60 bg-white/80 py-1.5 pl-6 pr-2 text-xs font-normal text-slate-700 outline-none transition-colors placeholder:text-emerald-300 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 shadow-sm"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
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
                    {row.getAllCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-5 py-3.5 text-sm text-slate-600 group-hover:text-slate-800 transition-colors"
                      >
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

      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-between gap-4 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm mt-4">
        <div className="flex items-center gap-2 whitespace-nowrap">
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

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-slate-500">Tổng cộng:</span>
            <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {total}
            </strong>
            <span className="text-slate-500">kết quả {isFetching && '(Đang tải...)'}</span>
          </div>
          <div className="flex items-center gap-2 sm:border-l sm:border-slate-200 sm:pl-6 whitespace-nowrap">
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

        <div className="flex items-center gap-1.5 whitespace-nowrap">
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