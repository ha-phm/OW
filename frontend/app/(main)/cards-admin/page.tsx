'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { useForm, useWatch } from 'react-hook-form';
import { useState } from 'react';
import { Landmark, Filter, Search, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthMe } from '../../../hooks/useAuthMe';
import { useAdminCards } from '../../../hooks/useAdminCards';
import { AdminCardItem } from '../../../types/admin-tables';
import { AdminDataTable, type AppFeatures } from '../../../components/AdminDataTable';
import { useAdminStore } from '../../../store/useAdminStore';
import { maskCardNumber } from '../../../utils/format';

const SEARCH_DEBOUNCE_MS = 300;

type FilterField = 'search' | 'cardNumber' | 'cardName' | 'userEmail';

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
        className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// Khai báo type cho Form Lọc
interface FilterFormValues {
  filterField: FilterField;
  inputValue: string;
}

// chuyển SortingState (v9) -> { sortBy, sortOrder } cho API.
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

  // 1. ÁP DỤNG REACT HOOK FORM CHO THANH TÌM KIẾM
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

  useEffect(() => {
    setValue('inputValue', getStoreValue(filterField));
  }, [filterField, getStoreValue, setValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
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

  // V9: ColumnDef nhận thêm generic TFeatures (AppFeatures, export từ AdminDataTable).
  // Cột "embossedName" là cột ghép (id, không có accessorKey) -> tắt sort vì
  // server không biết sort theo field ảo này; muốn sort được thì phải thêm
  // accessorFn + để server hỗ trợ sort theo firstName/lastName riêng.
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
          <div className="flex items-center gap-2">
            <span>{email}</span>
            {isActive === false && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] sm:text-xs text-red-600 font-bold whitespace-nowrap">
                Bị khóa
              </span>
            )}
          </div>
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
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <Landmark className="h-5 w-5 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Quản lý thẻ
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 px-3 bg-white rounded-xl border border-slate-200 shrink-0">
            <Filter className="w-4 h-4 text-emerald-500" />
            <select
              {...register('filterField')}
              className="bg-transparent py-2.5 text-sm focus:outline-none text-slate-700 font-medium cursor-pointer w-full sm:w-auto appearance-none pr-4"
            >
              <option value="search">Tìm kiếm chung</option>
              <option value="cardNumber">Số thẻ</option>
              <option value="cardName">Tên thẻ</option>
              <option value="userEmail">Email chủ sở hữu</option>
            </select>
          </div>
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              {...register('inputValue')}
              placeholder={
                filterField === 'search' ? 'Nhập từ khóa...' :
                filterField === 'userEmail' ? 'Nhập email...' : 'Nhập thông tin lọc...'
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>
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
    </div>
  );
}