'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form'; // 1. IMPORT THÊM useWatch
import { Search, BarChart2, Activity, Users, FileText, CreditCard, BarChart } from 'lucide-react';
import { AuthMe } from '@/types/user';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAdminContracts } from '../hooks/useAdminContracts';
import { useAdminCards } from '../hooks/useAdminCards';
import { AdminDataTable, type AppFeatures } from '@/components/AdminDataTable';
import { ColumnDef, ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { AdminContractItem, AdminCardItem } from '@/types/admin-tables';
import { AdminUser } from '@/types/user';
import { useAdminStore } from '../store/useAdminStore';
import { useAdminStats } from '../hooks/useAdminStats';

interface AdminDashboardProps {
  authData: AuthMe;
}

const convertFiltersToObject = (filters: ColumnFiltersState) => {
  return filters.reduce((acc, filter) => {
    acc[filter.id] = filter.value as string;
    return acc;
  }, {} as Record<string, string>);
};

// Mới: chuyển SortingState (v9) -> { sortBy, sortOrder } để gửi cho API.
// Nếu backend hỗ trợ nhiều cột sort thì đổi hàm này để trả về mảng thay vì 1 cặp.
const convertSortingToParams = (sorting: SortingState) => {
  const [first] = sorting;
  if (!first) return {};
  return {
    sortBy: first.id,
    sortOrder: first.desc ? ('desc' as const) : ('asc' as const),
  };
};

export function AdminDashboard({ authData }: AdminDashboardProps) {
  const {
    activeTab, setActiveTab,
    contractsParams, setContractsParams,
    cardsParams, setCardsParams
  } = useAdminStore();

  const { data: usersData, isLoading: isUsersLoading, isFetching: isUsersFetching } = useAdminUsers({
    enabled: activeTab === 'USERS'
  });

  const { data: contractsData, isLoading: isContractsLoading, isFetching: isContractsFetching } = useAdminContracts({
    search: contractsParams.search,
    page: contractsParams.page,
    pageSize: contractsParams.pageSize,
    filters: convertFiltersToObject(contractsParams.columnFilters || []),
    ...convertSortingToParams(contractsParams.sorting || []),
  }, {
    enabled: activeTab === 'CONTRACTS'
  });

  const { data: cardsData, isLoading: isCardsLoading, isFetching: isCardsFetching } = useAdminCards({
    search: cardsParams.search,
    page: cardsParams.page,
    pageSize: cardsParams.pageSize,
    filters: convertFiltersToObject(cardsParams.columnFilters || []),
    ...convertSortingToParams(cardsParams.sorting || []),
  }, {
    enabled: activeTab === 'CARDS'
  });

  // 2. LẤY `control` THAY VÌ `watch` TỪ useForm
  const { register, control, setValue } = useForm({
    defaultValues: { searchInput: '' }
  });

  // 3. DÙNG `useWatch` ĐỂ THEO DÕI GIÁ TRỊ NHẬP VÀO
  const searchInput = useWatch({
    control,
    name: 'searchInput',
  });

  useEffect(() => {
    if (activeTab === 'CONTRACTS') setValue('searchInput', contractsParams.search);
    else if (activeTab === 'CARDS') setValue('searchInput', cardsParams.search);
    else setValue('searchInput', '');
  }, [activeTab, contractsParams.search, cardsParams.search, setValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'CONTRACTS' && searchInput !== contractsParams.search) {
        setContractsParams({ search: searchInput });
      }
      if (activeTab === 'CARDS' && searchInput !== cardsParams.search) {
        setCardsParams({ search: searchInput });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, activeTab, setContractsParams, setCardsParams, contractsParams.search, cardsParams.search]);

  // ------------------------------------------------------------------
  // V9: ColumnDef nhận thêm generic TFeatures (lấy từ AdminDataTable qua `AppFeatures`).
  // enableSorting: true bật sort cho cột đó (rowSortingFeature mặc định enable hết,
  // nên chỉ cần khai báo false cho cột KHÔNG muốn sort).
  // ------------------------------------------------------------------
  const contractColumns: ColumnDef<AppFeatures, AdminContractItem, unknown>[] = [
    { accessorKey: 'contractNumber', header: 'Số hợp đồng', enableSorting: true },
    { accessorKey: 'contractName', header: 'Tên hợp đồng', enableSorting: true },
    { accessorKey: 'type', header: 'Loại', enableSorting: true },
    { accessorKey: 'productCode', header: 'Sản phẩm', enableSorting: false },
    { accessorKey: 'userEmail', header: 'Email chủ sở hữu', enableSorting: true },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      enableSorting: true,
      cell: ({ row }) => new Date(row.getValue<string>('createdAt')).toLocaleDateString('vi-VN')
    },
  ];

  const cardColumns: ColumnDef<AppFeatures, AdminCardItem, unknown>[] = [
    { accessorKey: 'cardNumber', header: 'Số thẻ (PAN)', enableSorting: true },
    { accessorKey: 'cardName', header: 'Tên thẻ', enableSorting: true },
    { accessorKey: 'embossedFirstName', header: 'Tên in nổi', enableSorting: true },
    { accessorKey: 'embossedLastName', header: 'Họ in nổi', enableSorting: true },
    { accessorKey: 'userEmail', header: 'Email chủ sở hữu', enableSorting: true },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      enableSorting: true,
      cell: ({ row }) => new Date(row.getValue<string>('createdAt')).toLocaleDateString('vi-VN')
    },
  ];

  const userColumns: ColumnDef<AppFeatures, AdminUser, unknown>[] = [
    { accessorKey: 'email', header: 'Email', enableSorting: true },
    {
      accessorKey: 'clientNumber',
      header: 'Số khách hàng',
      enableSorting: true,
      cell: ({ row }) => row.original.clientNumber || '---'
    },
    { accessorKey: 'role', header: 'Vai trò', enableSorting: true },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      enableSorting: true,
      cell: ({ row }) => new Date(row.getValue<string>('createdAt')).toLocaleDateString('vi-VN')
    },
  ];

  const totalUsersCount = Array.isArray(usersData) ? usersData.length : 0;
  const totalContractsCount = contractsData?.meta?.total || 0;
  const totalCardsCount = cardsData?.meta?.total || 0;
  const adminName = authData?.email?.split('@')[0] || 'Quản trị viên';

  const { data: stats, isLoading: statsLoading } = useAdminStats();

  return (
    <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white p-4 sm:p-6 lg:p-8 text-slate-900 shadow-xl border border-slate-100 min-h-[80vh] flex flex-col gap-6 sm:gap-8">
      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-br from-emerald-500 to-teal-700 p-6 sm:p-8 lg:p-10 shadow-lg shadow-teal-900/10">
        <div className="relative z-10 flex flex-col gap-2 md:w-2/3">
          <div className="flex items-center gap-2 text-teal-100 mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Hệ thống đang hoạt động tốt</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            Xin chào, {adminName}! 👋
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base text-teal-50">
            Hôm nay hệ thống đang quản lý <strong>{totalContractsCount}</strong> hợp đồng và phát hành thành công <strong>{totalCardsCount}</strong> thẻ.
            Dưới đây là công cụ để bạn kiểm soát toàn bộ luồng dữ liệu.
          </p>
        </div>
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-20 h-48 w-48 rounded-full bg-teal-900/20 blur-2xl pointer-events-none" />
        <div className="hidden md:flex absolute right-12 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none mix-blend-overlay">
          <BarChart2 className="w-32 h-32 lg:w-40 lg:h-40 text-white" />
        </div>
      </div>

      {/* THỐNG KÊ */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Khách hàng"
          value={statsLoading ? '...' : String(stats?.totalUsers ?? 0)}
        />
        <StatCard
          icon={<FileText className="h-6 w-6" />}
          label="Hợp đồng"
          value={statsLoading ? '...' : String(stats?.totalContracts ?? 0)}
        />
        <StatCard
          icon={<CreditCard className="h-6 w-6" />}
          label="Thẻ đã phát hành"
          value={statsLoading ? '...' : String(stats?.totalCards ?? 0)}
        />
        <StatCard
          icon={<BarChart className="h-6 w-6" />}
          label="TB thẻ/khách hàng"
          value={statsLoading ? '...' : String(stats?.avgCardsPerUser ?? '0.0')}
        />
      </div>

      {/* TABS & SEARCH */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-xl w-full lg:flex lg:w-max lg:gap-0">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-2 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-all truncate ${
              activeTab === 'USERS'
                ? 'bg-white text-emerald-600 font-bold shadow-sm'
                : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            Người dùng
          </button>
          <button
            onClick={() => setActiveTab('CONTRACTS')}
            className={`px-2 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-all truncate ${
              activeTab === 'CONTRACTS'
                ? 'bg-white text-emerald-600 font-bold shadow-sm'
                : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            Hợp đồng
          </button>
          <button
            onClick={() => setActiveTab('CARDS')}
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
          <div className="relative w-full lg:w-96 shrink-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              {...register('searchInput')}
              type="text"
              placeholder="Tìm kiếm tổng hợp hệ thống..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-shadow"
            />
          </div>
        )}
      </div>

      {/* RENDER BẢNG (TABLES) */}
      <div className="bg-white rounded-2xl w-full">
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
            showColumnFilters={false}
          />
        )}
        {activeTab === 'CONTRACTS' && (
          <AdminDataTable
            columns={contractColumns}
            data={contractsData?.data || []}
            page={contractsParams.page}
            pageSize={contractsParams.pageSize}
            totalPages={contractsData?.meta?.totalPages || 1}
            total={totalContractsCount}
            onPageChange={(page) => setContractsParams({ page })}
            onPageSizeChange={(pageSize) => setContractsParams({ pageSize, page: 1 })}
            showColumnFilters={false}
            isLoading={isContractsLoading}
            isFetching={isContractsFetching}
            sorting={contractsParams.sorting}
            onSortingChange={(sorting) => setContractsParams({ sorting })}
          />
        )}
        {activeTab === 'CARDS' && (
          <AdminDataTable
            columns={cardColumns}
            data={cardsData?.data || []}
            page={cardsParams.page}
            pageSize={cardsParams.pageSize}
            totalPages={cardsData?.meta?.totalPages || 1}
            total={totalCardsCount}
            onPageChange={(page) => setCardsParams({ page })}
            onPageSizeChange={(pageSize) => setCardsParams({ pageSize, page: 1 })}
            showColumnFilters={false}
            isLoading={isCardsLoading}
            isFetching={isCardsFetching}
            sorting={cardsParams.sorting}
            onSortingChange={(sorting) => setCardsParams({ sorting })}
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
        <div className="rounded-lg bg-emerald-100/80 p-1 sm:p-1.5 shrink-0">
          {icon}
        </div>
        <span className="text-xs sm:text-sm font-semibold text-slate-600 truncate">{label}</span>
      </div>
      <div className="text-xl sm:text-3xl font-bold tracking-tight text-slate-800 truncate">{value}</div>
    </div>
  );
}