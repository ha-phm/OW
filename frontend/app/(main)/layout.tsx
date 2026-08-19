'use client';
import { useState } from 'react';
import { Sidebar } from '../../components/SideBar';
import { Topbar } from '../../components/TopBar';
export default function MainLayout({ children }: { children: React.ReactNode }) {
  // Quản lý trạng thái mở/đóng Sidebar trên Mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* 1. Truyền state cho Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 2. Truyền hàm mở cho Topbar */}
        <Topbar 
          onToggleMenu={() => setIsSidebarOpen(true)} 
        />
        
        {/* 3. Vùng chứa nội dung */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}