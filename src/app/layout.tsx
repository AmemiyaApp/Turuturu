// src\app\layout.tsx
import './globals.css';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { ToastProvider } from '@/lib/utils/useToast';
import { logger } from '@/lib/monitoring';

export const metadata = {
  title: 'Turuturu',
  description: 'Canções infantis personalizadas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Log application startup
  if (typeof window === 'undefined') {
    logger.info('Application starting', {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <html lang="pt-BR">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#667eea" />
      </Head>
      <body className="font-comic">
        <ToastProvider>
          {children}
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}