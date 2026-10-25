import type {Metadata, Viewport} from 'next';
import './globals.css';
import './design-system.css';
import '@/components/landing/motion.css';
import '@/components/internships/program-artwork.css';
import { Providers } from '@/components/layout/providers';

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
    <html lang="az" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[var(--page)] antialiased flex flex-col"
        style={{ color: 'var(--ink)' }}
      >
        <a className="skip-link" href="#main-content">Əsas məzmuna keç / Skip to content</a>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
