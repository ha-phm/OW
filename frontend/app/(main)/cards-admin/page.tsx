'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { Landmark } from 'lucide-react';
import { useAuthMe } from '../../../hooks/useAuthMe';
import { useAdminCards } from '../../../hooks/useAdminCards';
import { AdminCardItem } from '../../../types/admin-tables';
import { AdminDataTable } from '../../../components/AdminDataTable';
import { useAdminStore } from '../../../hooks/useAdminStore'; // <-- Thêm dòng này

export default function AdminCardsPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useAuthMe();
  
  // Dùng Zustand thay cho useState cục bộ
  const { cardsParams, setCardsParams } = useAdminStore();
  const [searchInput, setSearchInput] = useState(cardsParams.search);

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== cardsParams.search) {
        setCardsParams({ search: searchInput }); 
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, cardsParams.search, setCardsParams]);

  useEffect(() => {
    if (!meLoading && me?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [meLoading, me, router]);

  const { data, isLoading, isFetching } = useAdminCards({
    ...cardsParams,
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
    <div className="flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <Landmark className="h-5 w-5 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Quản lý thẻ
          </h1>
        </div>

        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo số thẻ, tên, email..."
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        />
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data ?? []}
        page={data?.meta.page ?? cardsParams.page}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total ?? 0}
        pageSize={cardsParams.pageSize}
        onPageChange={(page) => setCardsParams({ page })}
        onPageSizeChange={(pageSize) => setCardsParams({ pageSize, page: 1 })} // Sửa lỗi phân trang ở đây
        isLoading={isLoading}
        isFetching={isFetching}
        emptyMessage="Không tìm thấy thẻ nào."
        // ---- THÊM 2 PROPS NÀY ĐỂ KẾT NỐI VỚI ZUSTAND ----
        columnFilters={Object.entries(cardsParams)
          .filter(([key, val]) => val && !['page', 'pageSize', 'search'].includes(key))
          .map(([id, value]) => ({ id, value: value as string }))}
        onColumnFiltersChange={(filters) => {
          // Biến mảng của TanStack thành Object cho Zustand
          const parsed = filters.reduce((acc, f) => ({ ...acc, [f.id]: f.value }), {} as any);
          
          setCardsParams({
            cardNumber: parsed.cardNumber || '',
            cardName: parsed.cardName || '',
            userEmail: parsed.userEmail || '',
            page: 1, // Tự động nhảy về trang 1 khi lọc
          });
        }}
      />
    </div>
  );
}