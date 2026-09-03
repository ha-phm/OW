'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { useForm, useWatch } from 'react-hook-form';
import { Landmark, Filter, Search, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthMe } from '../../../hooks/useAuthMe';
import { useAdminCards } from '../../../hooks/useAdminCards';
import { AdminCardItem } from '../../../types/admin-tables';
import { AdminDataTable, type AppFeatures } from '../../../components/AdminDataTable';
import { useAdminStore } from '../../../store/useAdminStore';
import { maskCardNumber } from '../../../utils/format';
import { CustomSelect } from '../../../components/CustomSelect';

const SEARCH_DEBOUNCE_MS = 300;

// 1. Thêm 'userIsActive' vào kiểu FilterField
type FilterField = 'search' | 'cardNumber' | 'cardName' | 'userEmail' | 'userIsActive';

// 2. Định nghĩa các Options cho CustomSelect
const FILTER_FIELD_OPTIONS = [
  { value: 'search', label: 'Tìm kiếm chung' },
  { value: 'cardNumber', label: 'Số thẻ' },
  { value: 'cardName', label: 'Tên thẻ' },
  { value: 'userEmail', label: 'Email chủ sở hữu' },
  { value: 'userIsActive', label: 'Trạng thái' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Bị khóa' },
];

function MaskedCardCell({ cardNumber, maskedCardNumber }: { cardNumber: string; maskedCardNumber?: string }) {
  const [copied, setCopied] = useState(false);
  const display = maskedCardNumber || maskCardNumber(cardNumber);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cardNumber);
    setCopied(true);
    toast.success('Đã sao chép số thẻ');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      <span className="text-slate-800 font-medium">{display}</span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Sao chép số thẻ"
        title="Sao chép số thẻ"
        className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition cursor-pointer"
      >
        {copied ? <Check aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600" /> : <Copy aria-hidden="true" className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// Khai báo type cho Form Lọc
interface FilterFormValues {
  filterField: FilterField;
  inputValue: string;
}

// Chuyển SortingState (v9) -> { sortBy, sortOrder } cho API.
const convertSortingToParams = (sorting: SortingState) => {
  const [first] = sorting;
  if (!first) return {};
  return {
    sortBy: first.id,
    sortOrder: first.desc ? ('desc' as const) : ('asc' as const),
  };
};

export default function AdminCardsPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useAuthMe();
  const { cardsParams, setCardsParams } = useAdminStore();

  const { register, control, setValue } = useForm<FilterFormValues>({
    defaultValues: {
      filterField: 'search',
      inputValue: cardsParams.search || '',
    }
  });

  const filterField = useWatch({ control, name: 'filterField' });
  const inputValue = useWatch({ control, name: 'inputValue' });

  const getStoreValue = useCallback((field: FilterField) => {
    if (field === 'search') return cardsParams.search || '';
    const filterObj = cardsParams.columnFilters?.find(f => f.id === field);
    return (filterObj?.value as string) || '';
  }, [cardsParams.search, cardsParams.columnFilters]);

  // Bỏ qua cập nhật inputValue nếu đang chọn Dropdown (Trạng thái)
  useEffect(() => {
    if (filterField !== 'userIsActive') {
      setValue('inputValue', getStoreValue(filterField));
    }
  }, [filterField, getStoreValue, setValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filterField !== 'userIsActive') {
        const currentValueInStore = getStoreValue(filterField);
        if (inputValue !== currentValueInStore) {
          if (filterField === 'search') {
            setCardsParams({ search: inputValue, page: 1 });
          } else {
            const currentFilters = cardsParams.columnFilters || [];
            const otherFilters = currentFilters.filter(f => f.id !== filterField);
            if (inputValue.trim() === '') {
              setCardsParams({ columnFilters: otherFilters, page: 1 });
            } else {
              setCardsParams({
                columnFilters: [...otherFilters, { id: filterField, value: inputValue }],
                page: 1
              });
            }
          }
        }
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue, filterField, getStoreValue, cardsParams.columnFilters, setCardsParams]);

  useEffect(() => {
    if (!meLoading && me?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [meLoading, me, router]);

  const filterObject = (cardsParams.columnFilters || []).reduce((acc, filter) => {
    acc[filter.id] = filter.value as string;
    return acc;
  }, {} as Record<string, string>);

  const { data, isLoading, isFetching } = useAdminCards({
    search: cardsParams.search,
    page: cardsParams.page,
    pageSize: cardsParams.pageSize,
    ...filterObject,
    ...convertSortingToParams(cardsParams.sorting || []),
  });

  if (meLoading || me?.role !== 'ADMIN') {
    return null;
  }

  const columns: ColumnDef<AppFeatures, AdminCardItem>[] = [
    {
      accessorKey: 'cardNumber',
      header: 'Số thẻ (PAN)',
      enableSorting: true,
      cell: ({ row }) => (
        <MaskedCardCell
          cardNumber={row.original.cardNumber}
          maskedCardNumber={row.original.maskedCardNumber}
        />
      ),
    },
    { accessorKey: 'cardName', header: 'Tên thẻ', enableSorting: true },
    {
      id: 'embossedName',
      header: 'Chủ thẻ',
      enableSorting: false,
      cell: ({ row }) =>
        `${row.original.embossedFirstName} ${row.original.embossedLastName}`.trim() ||
        '---',
    },
    { accessorKey: 'issuingContractNumber', header: 'HĐ phát hành', enableSorting: true },
    { 
      accessorKey: 'userEmail', 
      header: 'Chủ sở hữu', 
      enableSorting: true,
      cell: ({ row }) => {
        const email = row.getValue<string>('userEmail');
        
        return (
          <span className="font-medium text-slate-700">
            {email}
          </span>
        );
      }
    },
    // BỔ SUNG CỘT TRẠNG THÁI GIỐNG TRANG HỢP ĐỒNG
    {
      accessorKey: 'userIsActive',
      header: 'Trạng thái',
      enableSorting: true,
      cell: ({ getValue }) => {
        const isActive = getValue<boolean>();
        return isActive ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200 whitespace-nowrap">
            Hoạt động
          </span>
        ) : (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200 whitespace-nowrap">
            Bị khóa
          </span>
        );
      }
    },
    {
      accessorKey: 'expiryDate',
      header: 'Hết hạn',
      enableSorting: true,
      cell: ({ getValue }) => getValue<string | null>() ?? '---',
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      enableSorting: true,
      cell: ({ getValue }) =>
        new Date(getValue<string>()).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <main className="flex flex-col gap-5 p-4 sm:p-8">
      {/* VÙNG THÔNG BÁO ẨN CHO MÁY ĐỌC MÀN HÌNH */}
      <div aria-live="polite" className="sr-only">
        {isLoading || isFetching 
          ? 'Đang tải dữ liệu thẻ...' 
          : `Đã tìm thấy ${data?.meta.total ?? 0} thẻ.`}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <header className="flex items-center gap-3">
          <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <Landmark aria-hidden="true" className="h-5 w-5 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Quản lý thẻ
          </h1>
        </header>

        {/* KHU VỰC BỘ LỌC */}
        <form 
          role="search"
          aria-label="Bộ lọc thẻ" 
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-100"
        >
          {/* 1. Chọn trường cần lọc bằng CustomSelect */}
          <CustomSelect
            value={filterField}
            onChange={(val) => setValue('filterField', val as FilterField)}
            options={FILTER_FIELD_OPTIONS}
            icon={<Filter className="h-4 w-4" />}
            ariaLabel="Chọn trường cần lọc"
          />

          {/* 2. Ô Input tìm kiếm hoặc Dropdown Trạng thái */}
          {filterField === 'userIsActive' ? (
             <CustomSelect
              value={cardsParams.columnFilters?.find(f => f.id === 'userIsActive')?.value as string || ''}
              onChange={(val) => {
                const otherFilters = (cardsParams.columnFilters || []).filter(f => f.id !== 'userIsActive');
                setCardsParams({ 
                  columnFilters: val === '' ? otherFilters : [...otherFilters, { id: 'userIsActive', value: val }], 
                  page: 1 
                });
              }}
              options={STATUS_OPTIONS}
              ariaLabel="Lọc theo trạng thái"
            />
          ) : (
            <div className="relative flex-1">
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <label htmlFor="searchInput" className="sr-only">Nhập thông tin tìm kiếm</label>
              <input
                id="searchInput"
                {...register('inputValue')}
                placeholder={
                  filterField === 'search' ? 'Nhập từ khóa...' :
                  filterField === 'userEmail' ? 'Nhập email...' : 'Nhập thông tin lọc...'
                }
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
              />
            </div>
          )}
        </form>
      </div>

      <div aria-busy={isLoading || isFetching}>
        <AdminDataTable
          columns={columns}
          data={data?.data ?? []}
          page={data?.meta.page ?? cardsParams.page}
          totalPages={data?.meta.totalPages ?? 1}
          total={data?.meta.total ?? 0}
          pageSize={cardsParams.pageSize}
          onPageChange={(page) => setCardsParams({ page })}
          onPageSizeChange={(pageSize) => setCardsParams({ pageSize, page: 1 })}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyMessage="Không tìm thấy thẻ nào."
          showColumnFilters={false}
          sorting={cardsParams.sorting}
          onSortingChange={(sorting) => setCardsParams({ sorting })}
        />
      </div>
    </main>
  );
}