'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { useForm, useWatch } from 'react-hook-form';
import { FileStack, Filter, Search } from 'lucide-react';
import { useAuthMe } from '../../../hooks/useAuthMe';
import { useAdminContracts } from '../../../hooks/useAdminContracts';
import { AdminContractItem, ContractType } from '../../../types/admin-tables';
import { AdminDataTable, type AppFeatures } from '../../../components/AdminDataTable';
import { useAdminStore } from '../../../store/useAdminStore';

const SEARCH_DEBOUNCE_MS = 300;

const TYPE_LABEL: Record<ContractType, string> = {
  LIABILITY: 'Liability',
  ISSUING: 'Issuing',
};

// THÊM 'userIsActive' VÀO ĐÂY
type FilterField = 'search' | 'contractNumber' | 'contractName' | 'userEmail' | 'type' | 'userIsActive';

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

export default function AdminContractsPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useAuthMe();
  const { contractsParams, setContractsParams } = useAdminStore();

  const { register, control, setValue } = useForm<FilterFormValues>({
    defaultValues: {
      filterField: 'search',
      inputValue: contractsParams.search || '',
    }
  });

  const filterField = useWatch({ control, name: 'filterField' });
  const inputValue = useWatch({ control, name: 'inputValue' });

  const getStoreValue = useCallback((field: FilterField) => {
    if (field === 'search') return contractsParams.search || '';
    if (field === 'type') return contractsParams.type || '';
    const filterObj = contractsParams.columnFilters?.find(f => f.id === field);
    return (filterObj?.value as string) || '';
  }, [contractsParams.search, contractsParams.type, contractsParams.columnFilters]);

  // Bỏ qua cập nhật inputValue nếu đang chọn Dropdown (type hoặc userIsActive)
  useEffect(() => {
    if (filterField !== 'type' && filterField !== 'userIsActive') {
      setValue('inputValue', getStoreValue(filterField));
    }
  }, [filterField, getStoreValue, setValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filterField !== 'type' && filterField !== 'userIsActive') {
        const currentValueInStore = getStoreValue(filterField);
        if (inputValue !== currentValueInStore) {
          if (filterField === 'search') {
            setContractsParams({ search: inputValue, page: 1 });
          } else {
            const currentFilters = contractsParams.columnFilters || [];
            const otherFilters = currentFilters.filter(f => f.id !== filterField);
            if (inputValue.trim() === '') {
              setContractsParams({ columnFilters: otherFilters, page: 1 });
            } else {
              setContractsParams({
                columnFilters: [...otherFilters, { id: filterField, value: inputValue }],
                page: 1
              });
            }
          }
        }
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue, filterField, getStoreValue, contractsParams.columnFilters, setContractsParams]);

  useEffect(() => {
    if (!meLoading && me?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [meLoading, me, router]);

  const filterObject = (contractsParams.columnFilters || []).reduce((acc, filter) => {
    acc[filter.id] = filter.value as string;
    return acc;
  }, {} as Record<string, string>);

  const { data, isLoading, isFetching } = useAdminContracts({
    search: contractsParams.search,
    page: contractsParams.page,
    pageSize: contractsParams.pageSize,
    type: contractsParams.type || undefined,
    ...filterObject,
    ...convertSortingToParams(contractsParams.sorting || []),
  });

  if (meLoading || me?.role !== 'ADMIN') {
    return null;
  }

  const columns: ColumnDef<AppFeatures, AdminContractItem>[] = [
    { accessorKey: 'contractNumber', header: 'Số hợp đồng', enableSorting: true },
    { accessorKey: 'contractName', header: 'Tên hợp đồng', enableSorting: true },
    {
      accessorKey: 'type',
      header: 'Loại',
      enableSorting: true,
      cell: ({ getValue }) => {
        const value = getValue<ContractType>();
        return (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
              value === 'LIABILITY'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-sky-50 text-sky-700'
            }`}
          >
            {TYPE_LABEL[value]}
          </span>
        );
      },
    },
    { accessorKey: 'clientNumber', header: 'Mã KH', enableSorting: true },
    { 
      accessorKey: 'userEmail', 
      header: 'Chủ sở hữu', 
      enableSorting: true,
      cell: ({ row }) => {
        const email = row.getValue<string>('userEmail');
        const isActive = row.original.userIsActive; 
        
        return (
          <span className={`font-medium ${isActive === false ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
            {email}
          </span>
        );
      }
    },
    // THÊM CỘT TRẠNG THÁI
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
            <FileStack aria-hidden="true" className="h-5 w-5 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Quản lý hợp đồng
          </h1>
        </header>

        {/* THAY DIV THÀNH SECTION CÓ ARIA-LABEL */}
        <section aria-label="Bộ lọc và tìm kiếm hợp đồng" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 px-3 bg-white rounded-xl border border-slate-200 shrink-0">
            <Filter aria-hidden="true" className="w-4 h-4 text-emerald-500" />
            <select
              {...register('filterField')}
              aria-label="Chọn trường để lọc"
              className="bg-transparent py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded text-slate-700 font-medium cursor-pointer w-full sm:w-auto appearance-none pr-4"
            >
              <option value="search">Tìm kiếm chung</option>
              <option value="contractNumber">Số hợp đồng</option>
              <option value="contractName">Tên hợp đồng</option>
              <option value="userEmail">Email chủ sở hữu</option>
              <option value="type">Loại hợp đồng</option>
              <option value="userIsActive">Trạng thái CSH</option> {/* THÊM OPTION */}
            </select>
          </div>

          {filterField === 'type' ? (
            <select
              value={contractsParams.type || ''}
              onChange={(e) => setContractsParams({ type: e.target.value as ContractType | '', page: 1 })}
              aria-label="Lọc theo loại hợp đồng"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="">Tất cả loại</option>
              <option value="LIABILITY">Liability</option>
              <option value="ISSUING">Issuing</option>
            </select>
            
          ) : filterField === 'userIsActive' ? (
            // DROPDOWN CHO TRẠNG THÁI CSH
            <select
              value={contractsParams.columnFilters?.find(f => f.id === 'userIsActive')?.value as string || ''}
              onChange={(e) => {
                const val = e.target.value;
                const otherFilters = (contractsParams.columnFilters || []).filter(f => f.id !== 'userIsActive');
                setContractsParams({ 
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
        page={data?.meta.page ?? contractsParams.page}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total ?? 0}
        pageSize={contractsParams.pageSize}
        onPageChange={(page) => setContractsParams({ page })}
        onPageSizeChange={(pageSize) => setContractsParams({ pageSize, page: 1 })}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyMessage="Không tìm thấy hợp đồng nào."
        showColumnFilters={false}
        sorting={contractsParams.sorting}
        onSortingChange={(sorting) => setContractsParams({ sorting })}
      />
    </main>
  );
}