import './globals.css';
import Head from 'next/head';

export const metadata = {
  title: 'Turuturu',
  description: 'Canções infantis personalizadas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="font-comic">{children}</body>
    </html>
  );
}