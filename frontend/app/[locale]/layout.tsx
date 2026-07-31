import type { Metadata } from 'next';
import '../globals.css';
import Providers from './providers';
import { I18nProvider } from './I18nProvider';

export const metadata: Metadata = {
  title: 'Openway Dashboard',
  description: 'Client Profile Management System',
};

export default async function RootLayout({
  children,
  params, 
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; 
}) {
  
  const { locale } = await params;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Providers>
          <I18nProvider locale={locale}>
            {children}
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}