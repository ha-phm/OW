import { i18nRouter } from 'next-i18n-router';
import { i18nConfig } from './i18nConfig'; // Đường dẫn có thể khác tùy vị trí bạn đặt file này
import { NextRequest } from 'next/server';

// Đổi tên hàm từ 'middleware' thành 'proxy'
export function proxy(request: NextRequest) {
  return i18nRouter(request, i18nConfig);
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)'
};