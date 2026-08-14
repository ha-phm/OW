'use client';

import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation'; // Thêm 2 hook này

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const currentPathname = usePathname();

  const toggleLanguage = () => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'vi' ? 'en' : 'vi';

    const days = 30;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `NEXT_LOCALE=${newLang};expires=${date.toUTCString()};path=/`;

    let newPath;
    if (currentPathname.startsWith(`/${currentLang}`)) {
      newPath = currentPathname.replace(`/${currentLang}`, `/${newLang}`);
    } else {
      newPath = `/${newLang}${currentPathname}`;
    }

    i18n.changeLanguage(newLang);
    router.push(newPath);
    router.refresh(); 
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
      title="Thay đổi ngôn ngữ / Change language"
    >
      <Languages className="h-4 w-4" />
      <span>{i18n.language === 'vi' ? 'VI' : 'EN'}</span>
    </button>
  );
}