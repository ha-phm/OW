import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Openway Dashboard',
  description: 'Client Profile Management System',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  

  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <Providers>
            {children}
            <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}