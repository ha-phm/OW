'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { Landmark, Filter, Search } from 'lucide-react';
import { useAuthMe } from '../../../hooks/useAuthMe';
import { useAdminCards } from '../../../hooks/useAdminCards';
import { AdminCardItem } from '../../../types/admin-tables';
import { AdminDataTable } from '../../../components/AdminDataTable';
import { useAdminStore } from '../../../hooks/useAdminStore'; 

const SEARCH_DEBOUNCE_MS = 300; 

// Các cột cho phép lọc bên trang Thẻ
type FilterField = 'search' | 'cardNumber' | 'cardName' | 'userEmail';

export default function AdminCardsPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useAuthMe();

  const { cardsParams, setCardsParams } = useAdminStore();
  
  const [filterField, setFilterField] = useState<FilterField>('search');
  const [inputValue, setInputValue] = useState('');

  // ------------------------------------------------------------
  // HÀM TIỆN ÍCH: Lấy giá trị từ mảng columnFilters của Zustand
  // ------------------------------------------------------------
  const getStoreValue = (field: FilterField) => {
    if (field === 'search') return cardsParams.search || '';
    const filterObj = cardsParams.columnFilters?.find(f => f.id === field);
    return (filterObj?.value as string) || '';
  };

  // 1. Đồng bộ giao diện input khi đổi cột lọc
  useEffect(() => {
    setInputValue(getStoreValue(filterField));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterField]);

  // 2. Debounce: Đẩy dữ liệu vào mảng columnFilters của Zustand
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, filterField, cardsParams, setCardsParams]);

  useEffect(() => {
    if (!meLoading && me?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [meLoading, me, router]);

  // ------------------------------------------------------------
  // 3. CHUYỂN ĐỔI: Dàn phẳng columnFilters thành Object cho API
  // ------------------------------------------------------------
  const filterObject = (cardsParams.columnFilters || []).reduce((acc, filter) => {
    acc[filter.id] = filter.value as string;
    return acc;
  }, {} as Record<string, string>);

  const { data, isLoading, isFetching } = useAdminCards({
    search: cardsParams.search,
    page: cardsParams.page,
    pageSize: cardsParams.pageSize,
    ...filterObject, 
  });

  if (meLoading || me?.role !== 'ADMIN') {
    return null;
  }

  const columns: ColumnDef<AdminCardItem>[] = [
    { accessorKey: 'cardNumber', header: 'Số thẻ' },
    { accessorKey: 'cardName', header: 'Tên thẻ' },
    {
      id: 'embossedName',
      header: 'Chủ thẻ',
      cell: ({ row }) =>
        `${row.original.embossedFirstName} ${row.original.embossedLastName}`.trim() ||
        '—',
    },
    { accessorKey: 'issuingContractNumber', header: 'HĐ phát hành' },
    { accessorKey: 'userEmail', header: 'Chủ sở hữu' },
    {
      accessorKey: 'expiryDate',
      header: 'Hết hạn',
      cell: ({ getValue }) => getValue<string | null>() ?? '—',
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ getValue }) =>
        new Date(getValue<string>()).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8"> 
      
      {/* HEADER & THANH LỌC THÔNG MINH */}
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
              value={filterField}
              onChange={(e) => setFilterField(e.target.value as FilterField)}
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                filterField === 'search' ? 'Nhập từ khóa...' :
                filterField === 'userEmail' ? 'Nhập email...' : 'Nhập thông tin lọc...'
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
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
        showColumnFilters={false} // Giấu các phễu lọc thừa
      />
    </div>
  );
}