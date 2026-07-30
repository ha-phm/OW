'use client';

import { ReactNode, useEffect } from 'react';
// Nhớ sửa lại đường dẫn này cho đúng với vị trí file i18n của bạn
import '../../i18n/i18n'; 
import i18next from 'i18next'; // Import i18next để gọi hàm changeLanguage

// 1. Thêm locale: string vào kiểu dữ liệu của props ở đây
export function I18nProvider({ 
  children, 
  locale 
}: { 
  children: ReactNode;
  locale: string; 
}) {
  
  // 2. Tự động đồng bộ ngôn ngữ của i18next với URL
  useEffect(() => {
    if (i18next.language !== locale) {
      i18next.changeLanguage(locale);
    }
  }, [locale]);

  return <>{children}</>;
}