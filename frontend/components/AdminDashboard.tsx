'use client';

import { useState } from 'react';
import { Users, FileText, CreditCard, Search, BarChart2 } from 'lucide-react';
import { AuthMe } from '@/types/user';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAdminContracts } from '../hooks/useAdminContracts';
import { useAdminCards } from '../hooks/useAdminCards';
import { AdminDataTable } from '@/components/AdminDataTable';
import { ColumnDef } from '@tanstack/react-table';
import { AdminContractItem, AdminCardItem } from '@/types/admin-tables';
import { AdminUser } from '@/types/user';

interface AdminDashboardProps {
  authData: AuthMe;
}

export function AdminDashboard({ }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'USERS' | 'CONTRACTS' | 'CARDS'>('USERS');
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: usersData, isLoading: isUsersLoading, isFetching: isUsersFetching } = useAdminUsers();
  
  const { data: contractsData, isLoading: isContractsLoading, isFetching: isContractsFetching } = useAdminContracts({
    search,
    page,
    pageSize,
  });

  const { data: cardsData, isLoading: isCardsLoading, isFetching: isCardsFetching } = useAdminCards({
    search,
    page,
    pageSize,
  });

  const contractColumns: ColumnDef<AdminContractItem, unknown>[] = [
    { accessorKey: 'contractNumber', header: 'Số hợp đồng' },
    { accessorKey: 'contractName', header: 'Tên hợp đồng' },
    { accessorKey: 'type', header: 'Loại' },
    { accessorKey: 'productCode', header: 'Sản phẩm' },
    { accessorKey: 'userEmail', header: 'Email chủ sở hữu' },
    { 
      accessorKey: 'createdAt', 
      header: 'Ngày tạo',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('vi-VN')
    },
  ];

  const cardColumns: ColumnDef<AdminCardItem, unknown>[] = [
    { accessorKey: 'cardNumber', header: 'Số thẻ (PAN)' },
    { accessorKey: 'cardName', header: 'Tên thẻ' },
    { accessorKey: 'embossedFirstName', header: 'Tên in nổi' },
    { accessorKey: 'embossedLastName', header: 'Họ in nổi' },
    { accessorKey: 'userEmail', header: 'Email chủ sở hữu' },
    { 
      accessorKey: 'createdAt', 
      header: 'Ngày tạo',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('vi-VN')
    },
  ];

  const userColumns: ColumnDef<AdminUser, unknown>[] = [
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'clientNumber', header: 'Số khách hàng', cell: ({ row }) => row.original.clientNumber || '—' },
    { accessorKey: 'role', header: 'Vai trò' },
    { 
      accessorKey: 'createdAt', 
      header: 'Ngày tạo',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('vi-VN')
    },
  ];

  const totalUsersCount = Array.isArray(usersData) ? usersData.length : 0;
  const totalContractsCount = contractsData?.meta?.total || 0;
  const totalCardsCount = cardsData?.meta?.total || 0;
  const avgCards = totalUsersCount > 0 ? (totalCardsCount / totalUsersCount).toFixed(1) : '0';

  return (
    <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white p-4 sm:p-6 lg:p-8 text-slate-900 shadow-xl border border-slate-100 min-h-[80vh]">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-6 sm:mb-8">Tổng quan hệ thống</h1>

      {/* 2. Thống kê — 2 cột trên mobile thay vì xếp dọc chiếm hết màn hình */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 mb-8 sm:mb-10">
        <StatCard icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} label="Khách hàng" value={String(totalUsersCount)} />
        <StatCard icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5" />} label="Hợp đồng" value={String(totalContractsCount)} />
        <StatCard icon={<CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />} label="Thẻ đã phát hành" value={String(totalCardsCount)} />
        <StatCard icon={<BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" />} label="TB thẻ/khách hàng" value={String(avgCards)} />
      </div>

      {/* 3. Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        {/* Mobile: grid 3 cột chia đều vừa khít màn hình. Desktop: giữ nguyên flex w-max như cũ */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-xl w-full sm:flex sm:w-max sm:gap-0">
          <button
            onClick={() => { setActiveTab('USERS'); setPage(1); setSearch(''); }}
            className={`px-2 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-all truncate ${
              activeTab === 'USERS' 
                ? 'bg-white text-emerald-600 font-bold shadow-sm' 
                : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            Người dùng
          </button>
          <button
            onClick={() => { setActiveTab('CONTRACTS'); setPage(1); setSearch(''); }}
            className={`px-2 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-all truncate ${
              activeTab === 'CONTRACTS' 
                ? 'bg-white text-emerald-600 font-bold shadow-sm' 
                : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            Hợp đồng
          </button>
          <button
            onClick={() => { setActiveTab('CARDS'); setPage(1); setSearch(''); }}
            className={`px-2 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-all truncate ${
              activeTab === 'CARDS' 
                ? 'bg-white text-emerald-600 font-bold shadow-sm' 
                : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            Thẻ
          </button>
        </div>

        {activeTab !== 'USERS' && (
          <div className="relative w-full sm:w-96">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm dữ liệu hệ thống..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-shadow"
            />
          </div>
        )}
      </div>

      {/* 4. Render Tables */}
      <div className="bg-white rounded-2xl">
        {activeTab === 'USERS' && (
          <AdminDataTable
            columns={userColumns}
            data={Array.isArray(usersData) ? usersData : []}
            page={1}
            pageSize={totalUsersCount || 10}
            totalPages={1}
            total={totalUsersCount}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            isLoading={isUsersLoading}
            isFetching={isUsersFetching}
          />
        )}

        {activeTab === 'CONTRACTS' && (
          <AdminDataTable
            columns={contractColumns}
            data={contractsData?.data || []}
            page={page}
            pageSize={pageSize}
            totalPages={contractsData?.meta?.totalPages || 1}
            total={totalContractsCount}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            isLoading={isContractsLoading}
            isFetching={isContractsFetching}
          />
        )}

        {activeTab === 'CARDS' && (
          <AdminDataTable
            columns={cardColumns}
            data={cardsData?.data || []}
            page={page}
            pageSize={pageSize}
            totalPages={cardsData?.meta?.totalPages || 1}
            total={totalCardsCount}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            isLoading={isCardsLoading}
            isFetching={isCardsFetching}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3 rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50/50 to-teal-50/30 p-3 sm:p-5 shadow-sm transition-transform hover:-translate-y-1">
      <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600">
        <div className="rounded-lg bg-emerald-100/80 p-1 sm:p-1.5">
          {icon}
        </div>
        <span className="text-xs sm:text-sm font-semibold text-slate-600 truncate">{label}</span>
      </div>
      <div className="text-xl sm:text-3xl font-bold tracking-tight text-slate-800">{value}</div>
    </div>
  );
}