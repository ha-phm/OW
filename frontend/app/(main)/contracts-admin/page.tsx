'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { useForm, useWatch } from 'react-hook-form';
import { FileStack, Filter, Search } from 'lucide-react';
import { useAuthMe } from '../../../hooks/useAuthMe';
import { useAdminContracts } from '../../../hooks/useAdminContracts';
import { AdminContractItem, ContractType } from '../../../types/admin-tables';
import { AdminDataTable } from '../../../components/AdminDataTable';
import { useAdminStore } from '../../../store/useAdminStore'; 

const SEARCH_DEBOUNCE_MS = 300; 

const TYPE_LABEL: Record<ContractType, string> = {
  LIABILITY: 'Liability',
  ISSUING: 'Issuing',
};

type FilterField = 'search' | 'contractNumber' | 'contractName' | 'userEmail' | 'type';

// Khai báo type cho Form Lọc
interface FilterFormValues {
  filterField: FilterField;
  inputValue: string;
}

export default function AdminContractsPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useAuthMe();

  const { contractsParams, setContractsParams } = useAdminStore();
  
  // 1. ÁP DỤNG REACT HOOK FORM CHO THANH TÌM KIẾM
  const { register, control, setValue } = useForm<FilterFormValues>({
    defaultValues: {
      filterField: 'search',
      inputValue: contractsParams.search || '',
    }
  });

  const filterField = useWatch({ control, name: 'filterField' });
  const inputValue = useWatch({ control, name: 'inputValue' });

  // 2. DÙNG useCallback ĐỂ ESLINT HẾT BÁO LỖI EXHAUSTIVE DEPS
  const getStoreValue = useCallback((field: FilterField) => {
    if (field === 'search') return contractsParams.search || '';
    if (field === 'type') return contractsParams.type || '';
    
    const filterObj = contractsParams.columnFilters?.find(f => f.id === field);
    return (filterObj?.value as string) || '';
  }, [contractsParams.search, contractsParams.type, contractsParams.columnFilters]);

  // 3. Đồng bộ ô input khi người dùng đổi cột lọc (Không cần comment ép tắt lỗi nữa)
  useEffect(() => {
    if (filterField !== 'type') {
      setValue('inputValue', getStoreValue(filterField));
    }
  }, [filterField, getStoreValue, setValue]);

  // 4. Debounce: Lưu giá trị người dùng gõ vào Zustand
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filterField !== 'type') {
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

  // Dàn phẳng mảng columnFilters ra để API dễ đọc
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
  });

  if (meLoading || me?.role !== 'ADMIN') {
    return null;
  }

  const columns: ColumnDef<AdminContractItem>[] = [
    { accessorKey: 'contractNumber', header: 'Số hợp đồng' },
    { accessorKey: 'contractName', header: 'Tên hợp đồng' },
    {
      accessorKey: 'type',
      header: 'Loại',
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
    { accessorKey: 'clientNumber', header: 'Mã KH' },
    { accessorKey: 'userEmail', header: 'Chủ sở hữu' },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ getValue }) =>
        new Date(getValue<string>()).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8"> 
      
      {/* HEADER & THANH LỌC */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <FileStack className="h-5 w-5 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Quản lý hợp đồng
          </h1>
        </div>

        {/* Thanh Lọc Thông Minh (Responsive) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          
          {/* 1. Chọn Cột Cần Lọc */}
          <div className="flex items-center gap-2 px-3 bg-white rounded-xl border border-slate-200 shrink-0">
            <Filter className="w-4 h-4 text-emerald-500" />
            <select
              {...register('filterField')}
              className="bg-transparent py-2.5 text-sm focus:outline-none text-slate-700 font-medium cursor-pointer w-full sm:w-auto appearance-none pr-4"
            >
              <option value="search">Tìm kiếm chung</option>
              <option value="contractNumber">Số hợp đồng</option>
              <option value="contractName">Tên hợp đồng</option>
              <option value="userEmail">Email chủ sở hữu</option>
              <option value="type">Loại hợp đồng</option>
            </select>
          </div>

          {/* 2. Ô Nhập / Chọn Giá Trị (Đổi giao diện ngay lập tức khi chọn "type") */}
          {filterField === 'type' ? (
            <select
              value={contractsParams.type || ''}
              onChange={(e) => setContractsParams({ type: e.target.value as ContractType | '', page: 1 })}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none cursor-pointer"
            >
              <option value="">Tất cả loại</option>
              <option value="LIABILITY">Liability</option>
              <option value="ISSUING">Issuing</option>
            </select>
          ) : (
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
          )}
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
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
      />
    </div>
  );
}