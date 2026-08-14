'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, CreditCard, UserCog, FileStack, Landmark, LucideIcon } from 'lucide-react'; 
import { useAuthMe } from '../hooks/useAuthMe';

// 1. Chỉ khai báo những thuộc tính cơ bản nhất
type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

// 2. Xóa bỏ cờ requireAdmin, mở toàn bộ menu cho mọi user
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/clients', label: 'Khách hàng', icon: Users },
  { href: '/contracts', label: 'Hợp đồng', icon: FileText },
  { href: '/cards', label: 'Thẻ', icon: CreditCard },
  { href: '/users', label: 'Người dùng', icon: UserCog, adminOnly: true },
  { href: '/contracts-admin', label: 'Quản lý hợp đồng', icon: FileStack, adminOnly: true },
  { href: '/cards-admin', label: 'Quản lý thẻ', icon: Landmark, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: me } = useAuthMe();
   const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || me?.role === 'ADMIN');
  // Đã xóa toàn bộ logic check isAdmin ở đây để tránh lỗi TS

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm z-10">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">Openway</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-4 mt-2">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          
          // Kiểm tra active menu
          const isActive = href === '/dashboard' 
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-100">
        <div className="text-xs font-medium text-slate-400 text-center">
          Phiên bản 1.0.0
        </div>
      </div>
    </aside>
  );
}