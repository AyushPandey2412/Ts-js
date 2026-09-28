import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import ScrollToTop from '@/components/ScrollToTop';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import { getSearchIndex } from '@/lib/search-index';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#020617',
};

export const metadata: Metadata = {
  title: 'Engineering Academy — Multi-Stack Curriculum & Practice Platform',
  description: 'Zero-fluff technical curriculums across JavaScript, TypeScript, React, NestJS, PostgreSQL, Redis, and 70 Graded Algorithms.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchIndex = getSearchIndex();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body
        className="bg-slate-950 text-slate-100 flex flex-col md:flex-row min-h-screen w-full antialiased font-sans overflow-x-hidden"
        suppressHydrationWarning
      >
        <ReadingProgressBar />
        <Sidebar searchIndex={searchIndex} />
        <main
          id="main-content"
          className="flex-1 flex flex-col min-w-0 w-full min-h-[calc(100vh-53px)] md:h-screen md:overflow-y-auto relative overflow-x-hidden"
        >
          {children}
          <ScrollToTop />
        </main>
      </body>
    </html>
  );
}
