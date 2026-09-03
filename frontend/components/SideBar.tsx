'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, CreditCard, UserCog, LucideIcon, Leaf, Headset, X } from 'lucide-react';
import { useAuthMe } from '../hooks/useAuthMe';
import { FocusTrap } from 'focus-trap-react';

type NavItem = { 
  href: string; 
  label: string; 
  icon: LucideIcon; 
  adminOnly?: boolean;
  userOnly?: boolean; 
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/clients', label: 'Khách hàng', icon: Users, userOnly: true },
  { href: '/contracts-admin', label: 'Hợp đồng', icon: FileText, adminOnly: true },
  { href: '/cards', label: 'Thẻ', icon: CreditCard, userOnly: true }, 
  { href: '/cards-admin', label: 'Thẻ', icon: CreditCard, adminOnly: true},
  { href: '/users', label: 'Người dùng', icon: UserCog, adminOnly: true },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: me } = useAuthMe();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && me?.role !== 'ADMIN') return false;
    if (item.userOnly && me?.role === 'ADMIN') return false;
    return true;
  });

  // Nội dung Sidebar được tách riêng ra để dễ đưa vào FocusTrap
  const sidebarContent = (
    <>
      {isOpen && (
        <div 
          aria-hidden="true" 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside 
        aria-label="Thanh điều hướng bên"
        className={`fixed inset-y-0 left-0 z-50 m-4 flex w-48 shrink-0 flex-col rounded-3xl bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-[-120%]'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <Leaf aria-hidden="true" className="h-5 w-5 text-brand" />
            <span className="text-lg font-bold tracking-tight text-ink">Openway</span>
          </div>
          
          <button 
            onClick={onClose}
            aria-label="Đóng menu" 
            // focus-visible giúp nút X sáng lên khi dùng phím Tab
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        
        <nav 
          aria-label="Danh mục chính"
          className="flex flex-1 flex-col gap-1.5 px-3 py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none"
        >
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                // 2. SỬA THẺ LINK: Thêm mx-1 vào đầu chuỗi class
                className={`mx-1 flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  isActive ? 'bg-brand text-white shadow-md shadow-brand/30' : 'text-slate-400 hover:bg-slate-50 hover:text-ink'
                }`}
              >
                <Icon aria-hidden="true" className="h-4.5 w-4.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl border border-brand-light/40 bg-brand-mint p-4">
          <div aria-hidden="true" className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-dark shadow-sm">
            <Headset aria-hidden="true" className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold text-ink">Có vấn đề hoặc góp ý?</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Liên hệ bộ phận hỗ trợ</p>
          <button 
            className="mt-4 w-full rounded-full bg-brand py-2 text-xs font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-mint"
          >
            Contact Us
          </button>
        </div>
      </aside>
    </>
  );

  // 2. BỌC FOCUS TRAP
  // Chỉ kích hoạt FocusTrap trên màn hình nhỏ (khi Sidebar hoạt động như một Modal)
  // Nếu ở màn hình Desktop (lg), Sidebar cố định thì không cần Trap.
  return (
    <>
      <div className="lg:hidden">
        <FocusTrap
          active={isOpen}
          focusTrapOptions={{
            fallbackFocus: 'aside', 
            clickOutsideDeactivates: true, // Cho phép click ra ngoài màng đen để đóng
            escapeDeactivates: true, // Cho phép bấm nút Esc trên bàn phím để đóng
            onDeactivate: onClose,
          }}
        >
          <div>{sidebarContent}</div>
        </FocusTrap>
      </div>

      <div className="hidden lg:block">
        {sidebarContent}
      </div>
    </>
  );
}