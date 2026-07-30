'use client';

import { useTranslation } from 'react-i18next';

export function GlassNavbar() {
  const { t } = useTranslation();
  return (
    <nav className="flex justify-between items-center w-full mb-16 px-4">
      <div className="flex gap-4">
        <button className="bg-[#42b4b4] text-white px-8 py-2 rounded-full font-medium hover:bg-[#359090] transition">{t('glassNavbar.home')}</button>
        <button className="bg-white/10 text-white px-8 py-2 rounded-full font-medium hover:bg-white/20 transition">{t('glassNavbar.about')}</button>
      </div>
      <div className="flex gap-4">
        <button className="bg-[#42b4b4] text-white px-8 py-2 rounded-full font-medium hover:bg-[#359090] transition">{t('glassNavbar.login')}</button>
        <button className="bg-white/10 text-white px-8 py-2 rounded-full font-medium hover:bg-white/20 transition">{t('glassNavbar.contact')}</button>
      </div>
    </nav>
  );
}