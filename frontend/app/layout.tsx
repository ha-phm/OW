import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers'; 

export const metadata: Metadata = {
  title: 'Openway',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Bọc Providers xung quanh children */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}