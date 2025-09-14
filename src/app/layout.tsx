// src\app\layout.tsx
import './globals.css';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { ToastProvider } from '@/lib/utils/useToast';
import { logger } from '@/lib/monitoring';

export const metadata = {
  title: 'Turuturu - Canções Infantis Personalizadas',
  description: 'Canções infantis personalizadas para seu filho. Crie músicas únicas e especiais que estimulam o desenvolvimento e criam memórias inesquecíveis.',
  keywords: ['música infantil', 'canções personalizadas', 'desenvolvimento infantil', 'música educativa'],
  authors: [{ name: 'Turuturu' }],
  creator: 'Turuturu',
  publisher: 'Turuturu',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/logo.png', type: 'image/png', sizes: '40x40' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://turuturu.com.br',
    title: 'Turuturu - Canções Infantis Personalizadas',
    description: 'Canções infantis personalizadas para seu filho. Crie músicas únicas e especiais.',
    siteName: 'Turuturu',
    images: [
      {
        url: '/logo.png',
        width: 40,
        height: 40,
        alt: 'Turuturu Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Turuturu - Canções Infantis Personalizadas',
    description: 'Canções infantis personalizadas para seu filho. Crie músicas únicas e especiais.',
    images: ['/logo.png'],
  },
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
        <meta name="theme-color" content="#3B82F6" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/logo.png" />
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