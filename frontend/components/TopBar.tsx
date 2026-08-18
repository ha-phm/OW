'use client';

import { LogOut } from 'lucide-react';
import { useLogout } from '../hooks/useAuthMutations'; 

type TopbarProps = {
  userName?: string; 
  companyName?: string;
};

export function Topbar({ userName = 'Khách hàng', companyName }: TopbarProps) {
  
  const { mutate: logout, isPending } = useLogout();

  const handleLogout = () => {
    logout(); 
  };

 
  const cleanName = companyName
    ? userName.replace(new RegExp(`\\s*${companyName}\\s*$`), '').trim()
    : userName;


  const initial = cleanName ? cleanName.charAt(0).toUpperCase() : 'K';

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 z-10">
      <div />
      <div className="flex items-center gap-4">
        
        
        <div className="h-5 w-px bg-slate-200" />
        
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            {initial}
          </div>
          <span className="text-sm font-medium text-slate-700">{cleanName}</span>
        </div>
        
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="h-4 w-4" />
          {isPending ? 'Đang thoát...' : 'Logout'}
        </button>
      </div>
    </header>
  );
}