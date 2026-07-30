'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // 1. Import hook

// Thay vì viết cứng text tiếng Việt, ta lưu key (ví dụ: 'sidebar.dashboard')
const NAV_ITEMS = [
  { href: '/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clients', labelKey: 'sidebar.clients', icon: Users },
  { href: '/dashboard/contracts', labelKey: 'sidebar.contracts', icon: FileText },
  { href: '/dashboard/cards', labelKey: 'sidebar.cards', icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-slate-900">Openway</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}