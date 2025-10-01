import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/providers/SessionProvider';
import './globals.css';
import SignOutHandler from '@/components/SignOutHandler';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'URL Shortener SaaS',
  description: 'Professional URL shortening service for businesses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
           <SignOutHandler />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
