import { AuthProvider } from './providers';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your app description',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}