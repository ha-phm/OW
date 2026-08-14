'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '../../hooks/useCurrentUser'; // Chú ý đường dẫn import
import { Sidebar } from '../../components/SideBar';
import { Topbar } from '../../components/TopBar';

export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isLoading, isError } = useCurrentUser();

  // Bắt lỗi (vd: Token hết hạn, 401 Unauthorized) thì văng ra login
  useEffect(() => {
    if (isError) router.replace('/login');
  }, [isError, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-medium">Đang tải không gian làm việc...</p>
      </div>
    );
  }

  // Nếu không có data, ngắt render để tránh crash
  if (!data) return null;

  const profile = data.IssClientDetailsV2APIRecord;

  const displayName = profile
    ? [profile.LastName, profile.MiddleName, profile.FirstName].filter(Boolean).join(' ') || profile.FullName
    : 'Khách hàng';

  return (
    <div className="relative flex h-screen w-full bg-slate-50 overflow-hidden">
    
      <div className="absolute inset-0 -z-20 bg-slate-50" />
      
      {/* Ảnh nền mờ nhạt - đồng bộ không khí với trang login */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-[0.06]"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        
        <Topbar userName={displayName || 'Khách hàng'} />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
        
      </div>
    </div>
  );
}