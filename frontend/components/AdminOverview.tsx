'use client';
import { useMemo } from 'react';
import { Users, UserCheck, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAdminUsers } from '../hooks/useAdminUsers';

export function AdminOverview() {
  const { data: users, isLoading } = useAdminUsers();

  const stats = useMemo(() => {
    const list = users ?? [];
    return {
      total: list.length,
      withProfile: list.filter((u) => u.clientId).length,
      admins: list.filter((u) => u.role === 'ADMIN').length,
      // % user đã tạo hồ sơ khách hàng — chỉ số "sức khỏe onboarding"
      completionRate: list.length ? Math.round((list.filter((u) => u.clientId).length / list.length) * 100) : 0,
    };
  }, [users]);

  if (isLoading) return <div className="p-8 text-center text-slate-400">Đang tải dữ liệu quản trị...</div>;

  return (
    <div className="flex flex-col gap-8 p-2 md:p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview quản trị</h1>
        <p className="text-sm text-slate-500">Số liệu tổng quan toàn hệ thống</p>
      </div>

    </div>
  );
}