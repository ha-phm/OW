'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { ThemeSwitcher } from './ThemeSwitcher';

type TopbarProps = {
  userName: string;
  companyName?: string; // truyền vào để loại bỏ khỏi tên hiển thị nếu WAY4 tự ghép vào userName
};

export function Topbar({ userName, companyName }: TopbarProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = () => {
    localStorage.removeItem('access_token'); // sửa đúng key khớp với api.ts
    router.push('/login');
  };

  // Loại bỏ tên công ty nếu nó bị dính vào cuối chuỗi userName
  const cleanName = companyName
    ? userName.replace(new RegExp(`\\s*${companyName}\\s*$`), '').trim()
    : userName;

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
      <div />
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeSwitcher />
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            {cleanName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-slate-700">{cleanName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          {/* Cập nhật thành key của topbar */}
          {t('topbar.logout')}
        </button>
      </div>
    </header>
  );
}