import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import { Toaster } from 'sonner';
import AuthListener from '../components/AuthListener';

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
          <AuthListener>
            {children}
            <Toaster position="top-right" richColors />
          </AuthListener>
        </Providers>
      </body>
    </html>
  );
}