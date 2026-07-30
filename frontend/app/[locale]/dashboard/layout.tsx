'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { Sidebar } from '../../../components/layout/SideBar';
import { Topbar } from '../../../components/layout/TopBar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (isError) router.replace('/login');
  }, [isError, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-400">Đang tải...</p>
      </div>
    );
  }

  if (!data) return null;

  const profile = data.IssClientDetailsV2APIRecord;

  // Ghép tên hiển thị an toàn dù profile là null (user chưa tạo hồ sơ)
  const displayName = profile
    ? [profile.LastName, profile.MiddleName, profile.FirstName].filter(Boolean).join(' ') ||
      profile.FullName ||
      'Người dùng mới'
    : 'Người dùng mới';

  return (
    <div className="relative flex min-h-screen">
      {/* Ảnh nền mờ nhạt - chỉ để tạo không khí đồng bộ với trang login, không ảnh hưởng độ dễ đọc */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center opacity-[0.06]"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      <div className="fixed inset--100 -z-10 bg-slate-50"/>

      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar userName={displayName} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}