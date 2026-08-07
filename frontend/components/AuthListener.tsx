'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthListener({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleUnauthorized = () => {
      if (pathname !== '/login') {
        router.push('/login');
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [router, pathname]);

  return <>{children}</>;
}