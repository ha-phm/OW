'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/SideBar';
import { Topbar } from '../../components/TopBar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter(); 

  // 3. THÊM USEEFFECT ĐỂ LẮNG NGHE SỰ KIỆN LOGOUT TỪ AXIOS INTERCEPTOR
  useEffect(() => {
    const handleUnauthorized = () => {
      // Khi Refresh Token chết, đá người dùng về trang đăng nhập
      router.push('/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [router]);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar 
          onToggleMenu={() => setIsSidebarOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}