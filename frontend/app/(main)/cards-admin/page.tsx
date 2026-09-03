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

const SEARCH_DEBOUNCE_MS = 300;

// THÊM 'userIsActive' VÀO ĐÂY
type FilterField = 'search' | 'cardNumber' | 'cardName' | 'userEmail' | 'userIsActive';

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
        title="Sao chép số thẻ"
        aria-label={`Sao chép số thẻ ${display}`}
        className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        {copied ? (
          <Check aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Copy aria-hidden="true" className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

interface FilterFormValues {
  filterField: FilterField;
  inputValue: string;
}

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

  // Bỏ qua việc set inputValue nếu đang chọn field Dropdown (userIsActive)
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
        const isActive = row.original.userIsActive; 
        
        return (
          // Nếu bị khóa thì làm mờ và gạch ngang email cho đồng bộ với bảng User
          <span className={`font-medium ${isActive === false ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
            {email}
          </span>
        );
      }
    },
    // THÊM CỘT TRẠNG THÁI (dựa vào userIsActive)
    {
      accessorKey: 'userIsActive',
      header: 'Trạng thái CSH',
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
    // THAY DIV THÀNH MAIN
    <main className="flex flex-col gap-5 p-4 sm:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* THAY DIV THÀNH HEADER */}
        <header className="flex items-center gap-3">
          <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <Landmark aria-hidden="true" className="h-5 w-5 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Quản lý thẻ
          </h1>
        </header>

        {/* THAY DIV THÀNH SECTION CÓ ARIA-LABEL */}
        <section aria-label="Bộ lọc và tìm kiếm thẻ" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 px-3 bg-white rounded-xl border border-slate-200 shrink-0">
            <Filter aria-hidden="true" className="w-4 h-4 text-emerald-500" />
            <select
              {...register('filterField')}
              aria-label="Chọn trường để lọc"
              className="bg-transparent py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded text-slate-700 font-medium cursor-pointer w-full sm:w-auto appearance-none pr-4"
            >
              <option value="search">Tìm kiếm chung</option>
              <option value="cardNumber">Số thẻ</option>
              <option value="cardName">Tên thẻ</option>
              <option value="userEmail">Email chủ sở hữu</option>
              <option value="userIsActive">Trạng thái CSH</option> {/* THÊM OPTION */}
            </select>
          </div>
          
          {filterField === 'userIsActive' ? (
            // DROPDOWN CHO TRẠNG THÁI
            <select
              value={cardsParams.columnFilters?.find(f => f.id === 'userIsActive')?.value as string || ''}
              onChange={(e) => {
                const val = e.target.value;
                const otherFilters = (cardsParams.columnFilters || []).filter(f => f.id !== 'userIsActive');
                setCardsParams({ 
                  columnFilters: val === '' ? otherFilters : [...otherFilters, { id: 'userIsActive', value: val }], 
                  page: 1 
                });
              }}
              aria-label="Lọc theo trạng thái chủ sở hữu"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Bị khóa</option>
            </select>
          ) : (
            // Ô INPUT BÌNH THƯỜNG
            <div className="relative flex-1">
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                {...register('inputValue')}
                aria-label="Nhập thông tin cần tìm kiếm"
                placeholder={
                  filterField === 'search' ? 'Nhập từ khóa...' :
                  filterField === 'userEmail' ? 'Nhập email...' : 'Nhập thông tin lọc...'
                }
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
          )}
        </section>
      </div>

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
    </main>
  );
}