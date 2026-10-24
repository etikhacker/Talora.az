import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles
import { Providers } from '@/components/layout/providers';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Talora — İlk peşəkar təcrübənə başla',
  description: 'Azərbaycanda tələbələr üçün təcrübə platforması. Bacarıqlarını inkişaf etdir və real təcrübə qazan.',
  icons: {
    icon: [
      { url: '/talora-mark.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Talora — Discover Internship Opportunities',
    description: 'Discover internship opportunities, gain practical experience, and build skills for your future with Talora.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talora — Discover Internship Opportunities',
    description: 'Discover internship opportunities, gain practical experience, and build skills for your future with Talora.',
  },
};

export const viewport: Viewport = {
  themeColor: '#435FD1',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="az" className="light" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[var(--page)] antialiased flex flex-col"
        style={{ color: 'var(--ink)' }}
      >
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
