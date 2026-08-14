'use client';

import { useEffect, useState } from 'react';
import { UserCog, Trash2, Pencil } from 'lucide-react';
import { useAdminUsers, useUpdateUserRole, useDeleteUser } from '../../../hooks/useAdminUsers';
import { useAuthMe } from '../../../hooks/useAuthMe';
import { Role } from '../../../types/user';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function UsersPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useAuthMe();
  const { data: users, isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!meLoading && me?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [meLoading, me, router]);

  if (meLoading || me?.role !== 'ADMIN') {
    return null;
  }

  if (isLoading) return <div className="p-8 text-center">Đang tải danh sách người dùng...</div>;

  const filtered = (users ?? []).filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRoleChange = (userId: number, userEmail: string, newRole: Role) => {
    toast(`Xác nhận đổi quyền?`, {
      description: `Đổi quyền của ${userEmail} thành ${newRole}.`,
      action: {
        label: 'Đồng ý',
        onClick: () => {
            updateRole.mutate({ id: userId, role: newRole });
        },
      },
      cancel: {
        label: 'Huỷ',
        onClick: () => {}, 
      },
    });
  };

  const handleDeleteUser = (userId: number, userEmail: string) => {
    toast.error(`Xoá vĩnh viễn tài khoản?`, {
      description: `Tài khoản ${userEmail} sẽ bị xoá và không thể khôi phục.`,
      actionButtonStyle: { backgroundColor: '#dc2626', color: 'white' },
      cancelButtonStyle: { backgroundColor: '#e5e7eb', color: '#374151' },
      action: {
        label: 'Xoá ngay',
        onClick: () => {
          deleteUser.mutate(userId);
        },
      },
      cancel: {
        label: 'Huỷ',
        onClick: () => {}, 
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <UserCog className="h-5 w-5 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Quản lý người dùng</h1>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo email..."
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Email</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Hồ sơ</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Quyền</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Ngày tạo</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-5 py-3 text-sm text-slate-700">{user.email}</td>
                <td className="px-5 py-3 text-sm">
                  {user.clientId ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Đã tạo
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                      Chưa có
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-sm">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, user.email, e.target.value as Role)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-emerald-400 focus:outline-none cursor-pointer bg-white"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-5 py-3 text-sm text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        toast('Đang mở trang chỉnh sửa...', { description: user.email });
                      }}
                      title="Chỉnh sửa thông tin"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      title="Xoá tài khoản"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">
                  Không tìm thấy người dùng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}