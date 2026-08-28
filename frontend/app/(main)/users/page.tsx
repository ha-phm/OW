'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { UserCog, Trash2, Pencil, Search, Unlock } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminUsers, useUpdateUserRole, useDeleteUser, useRestoreUser } from '../../../hooks/useAdminUsers';
import { useAuthMe } from '../../../hooks/useAuthMe';
import { AdminUser, Role } from '../../../types/user';
import { AdminDataTable, type AppFeatures } from '../../../components/AdminDataTable';
import { useAdminStore } from '../../../store/useAdminStore';

// Hàm chuẩn hoá sort
const convertSortingToParams = (sorting: SortingState) => {
  const [first] = sorting;
  if (!first) return {};
  return {
    sortBy: first.id,
    sortOrder: first.desc ? ('desc' as const) : ('asc' as const),
  };
};

export default function UsersPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useAuthMe();
  
  const { usersParams, setUsersParams } = useAdminStore();
  const [searchInput, setSearchInput] = useState(usersParams.search || '');

  // ĐÃ SỬA: Lấy dữ liệu và truyền param thẳng xuống API
  const { data: usersData, isLoading, isFetching } = useAdminUsers({
    search: usersParams.search,
    page: usersParams.page,
    pageSize: usersParams.pageSize,
    ...convertSortingToParams(usersParams.sorting || []),
  });

  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const restoreUser = useRestoreUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== usersParams.search) {
        setUsersParams({ search: searchInput, page: 1 });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, usersParams.search, setUsersParams]);

  useEffect(() => {
    if (!meLoading && me?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [meLoading, me, router]);

  if (meLoading || me?.role !== 'ADMIN') {
    return null;
  }

  const handleRoleChange = (userId: number, userEmail: string, newRole: Role) => {
    toast(`Xác nhận đổi quyền?`, {
      description: `Đổi quyền của ${userEmail} thành ${newRole}.`,
      action: {
        label: 'Đồng ý',
        onClick: () => updateRole.mutate({ id: userId, role: newRole }),
      },
      cancel: { label: 'Huỷ', onClick: () => {} },
    });
  };

  const handleDeleteUser = (userId: number, userEmail: string) => {
    toast.error(`Vô hiệu hóa tài khoản?`, {
      description: `Tài khoản ${userEmail} sẽ bị khóa và không thể đăng nhập.`,
      actionButtonStyle: { backgroundColor: '#dc2626', color: 'white' },
      cancelButtonStyle: { backgroundColor: '#e5e7eb', color: '#374151' },
      action: {
        label: 'Khóa ngay',
        onClick: () => deleteUser.mutate(userId),
      },
      cancel: { label: 'Huỷ', onClick: () => {} },
    });
  };

  const columns: ColumnDef<AppFeatures, AdminUser>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      enableSorting: true,
      cell: ({ row }) => {
        const email = row.getValue<string>('email');
        const isActive = row.original.isActive;
        return (
          <div className="flex items-center gap-2">
            <span className={isActive === false ? 'text-slate-400 line-through' : ''}>
              {email}
            </span>
            {isActive === false && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] sm:text-xs text-red-600 font-bold whitespace-nowrap">
                Vô hiệu hóa
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'clientNumber',
      header: 'Số khách hàng',
      enableSorting: true,
      cell: ({ row }) => row.original.clientNumber || '---'
    },
    {
      accessorKey: 'role',
      header: 'Quyền',
      enableSorting: true,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(user.id, user.email, e.target.value as Role)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-emerald-400 focus:outline-none cursor-pointer bg-white"
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      enableSorting: true,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString('vi-VN'),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        const isActive = user.isActive;

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => toast('Đang mở trang chỉnh sửa...', { description: user.email })}
              title="Chỉnh sửa thông tin"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {isActive !== false ? (
              // Nút Vô hiệu hóa (Khóa)
              <button
                onClick={() => handleDeleteUser(user.id, user.email)}
                title="Vô hiệu hoá tài khoản"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : (
              // Nút Khôi phục (Mở khóa)
              <button
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn mở khóa tài khoản ${user.email} không?`)) {
                    restoreUser.mutate(user.id);
                  }
                }}
                title="Mở khóa tài khoản"
                className="rounded-lg p-2 text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-600"
              >
                <Unlock className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <UserCog className="h-5 w-5 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Quản lý người dùng</h1>
        </div>

        <div className="relative w-full sm:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo email..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={usersData?.data || []}
        page={usersParams.page || 1}
        pageSize={usersParams.pageSize || 10}
        totalPages={usersData?.meta?.totalPages || 1}
        total={usersData?.meta?.total || 0}
        onPageChange={(page) => setUsersParams({ page })}
        onPageSizeChange={(pageSize) => setUsersParams({ pageSize, page: 1 })}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyMessage="Không tìm thấy người dùng nào."
        showColumnFilters={false}
        sorting={usersParams.sorting}
        onSortingChange={(sorting) => setUsersParams({ sorting })}
      />
    </div>
  );
}