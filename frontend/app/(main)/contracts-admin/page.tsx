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
import { CustomSelect } from '../../../components/CustomSelect';

const SEARCH_DEBOUNCE_MS = 300;

const TYPE_LABEL: Record<ContractType, string> = {
  LIABILITY: 'Liability',
  ISSUING: 'Issuing',
};

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

// --- ĐỊNH NGHĨA CÁC MẢNG DỮ LIỆU CHO CUSTOM SELECT ---
const FILTER_FIELD_OPTIONS = [
  { value: 'search', label: 'Tìm kiếm chung' },
  { value: 'contractNumber', label: 'Số hợp đồng' },
  { value: 'contractName', label: 'Tên hợp đồng' },
  { value: 'userEmail', label: 'Email chủ sở hữu' },
  { value: 'type', label: 'Loại hợp đồng' },
  { value: 'userIsActive', label: 'Trạng thái' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'ISSUING', label: 'Issuing' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Bị khóa' },
];
// -----------------------------------------------------

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
          ? 'Đang tải dữ liệu hợp đồng...' 
          : `Đã tìm thấy ${data?.meta.total ?? 0} hợp đồng.`}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <header className="flex items-center gap-3">
          <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <FileStack aria-hidden="true" className="h-5 w-5 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Quản lý hợp đồng
          </h1>
        </header>

        {/* KHU VỰC BỘ LỌC (Thay <select> bằng <CustomSelect>) */}
        <form 
          role="search"
          aria-label="Bộ lọc hợp đồng" 
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-100"
        >
          {/* 1. Chọn trường cần lọc */}
          <CustomSelect
            value={filterField}
            onChange={(val) => setValue('filterField', val as FilterField)}
            options={FILTER_FIELD_OPTIONS}
            icon={<Filter className="h-4 w-4" />}
            ariaLabel="Chọn trường cần lọc"
          />

          {/* 2. Ô nhập/chọn giá trị lọc tương ứng */}
          {filterField === 'type' ? (
            <CustomSelect
              value={contractsParams.type || ''}
              onChange={(val) => setContractsParams({ type: val as ContractType | '', page: 1 })}
              options={TYPE_OPTIONS}
              ariaLabel="Lọc theo loại hợp đồng"
            />
            
          ) : filterField === 'userIsActive' ? (
            <CustomSelect
              value={contractsParams.columnFilters?.find(f => f.id === 'userIsActive')?.value as string || ''}
              onChange={(val) => {
                const otherFilters = (contractsParams.columnFilters || []).filter(f => f.id !== 'userIsActive');
                setContractsParams({ 
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
      </div>
    </main>
  );
}