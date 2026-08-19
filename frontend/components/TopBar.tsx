'use client';
import { Mail, MessageCircle, LogOut, Menu } from 'lucide-react';
import { useLogout } from '../hooks/useAuthMutations';
import { useAuthMe } from '../hooks/useAuthMe';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ThemeSwitcher } from './ThemeSwitcher';

type TopbarProps = { 
  onToggleMenu?: () => void; // Prop để mở Sidebar trên Mobile
};

export function Topbar({ onToggleMenu }: TopbarProps) {
  const { mutate: logout, isPending } = useLogout();
  
  // 1. Tự động lấy dữ liệu người dùng ngay bên trong Topbar
  const { data: authData } = useAuthMe();
  const { data: clientData } = useCurrentUser();

  // 2. Trích xuất tên từ hồ sơ hệ thống Openway
  const profile = clientData?.IssClientDetailsV2APIRecord;
  const profileName = profile
    ? [profile.LastName, profile.MiddleName, profile.FirstName].filter(Boolean).join(' ') || profile.FullName
    : null;

  // 3. Logic ưu tiên hiển thị: Tên Hồ Sơ -> Email -> 'Admin'
  const userName = profileName || authData?.email || 'Admin';
  
  // Lấy chữ cái đầu tiên để làm Avatar
  const initial = userName.charAt(0).toUpperCase();

  return (
    <header className="flex w-full items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
      {/* Nút Menu Hamburger (Chỉ hiện trên Mobile/Tablet) */}
      <button 
        onClick={onToggleMenu}
        className="flex items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Cụm công cụ bên phải */}
      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
        

        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:text-brand">
          <Mail className="h-4 w-4" />
        </button>
        <button className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:text-brand sm:flex">
          <MessageCircle className="h-4 w-4" />
        </button>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeSwitcher />
        </div>

        <div className="hidden h-6 w-px bg-slate-200 sm:block" />

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
            {initial}
          </div>
          {/* Đã thêm class truncate và max-w để nếu email quá dài sẽ tự có dấu ... */}
          <span className="hidden max-w-37.5 truncate text-sm font-medium text-ink md:inline" title={userName}>
            {userName}
          </span>
        </div>

        <button
          onClick={() => logout()}
          disabled={isPending}
          title="Đăng xuất"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:text-red-500 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}