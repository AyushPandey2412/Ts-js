import type { Metadata } from 'next';
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
        className="bg-slate-950 text-slate-100 flex min-h-screen antialiased font-sans"
        suppressHydrationWarning
      >
        <ReadingProgressBar />
        <Sidebar searchIndex={searchIndex} />
        <main id="main-content" className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
          {children}
          <ScrollToTop />
        </main>
      </body>
    </html>
  );
}
