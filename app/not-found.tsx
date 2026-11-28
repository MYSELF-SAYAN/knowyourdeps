import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX, ArrowLeft, FileSearch } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://knowyourdeps.dev';

export const metadata: Metadata = {
  title: 'Page Not Found — KnowYourDeps',
  description: 'The page you were looking for could not be found. Search for an npm or PyPI package on KnowYourDeps.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Page Not Found — KnowYourDeps',
    description: 'The page you were looking for could not be found.',
    url: BASE_URL,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#0f172a] relative">
      {/* Sky atmosphere */}
      <div className="sky-full-page-bg" aria-hidden="true">
        <div className="sky-clouds-overlay" />
      </div>

      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center text-center px-5 relative z-10"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-[#cde3fa] shadow-[0_24px_64px_-16px_rgba(3,28,77,0.2)] p-10 sm:p-14 max-w-md w-full space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#eff6ff] border border-[#cde3fa] text-[#0558d6] flex items-center justify-center">
              <SearchX className="h-7 w-7" aria-hidden="true" />
            </div>
          </div>

          <div>
            <p className="font-mono text-[12px] text-[#64748b] font-semibold uppercase tracking-widest mb-2">
              404
            </p>
            <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight tracking-[-0.025em] text-[#0f172a]">
              Page not found
            </h1>
            <p className="mt-3 text-[14px] text-[#475569] leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist. Try searching for an npm or PyPI package instead.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0558d6] text-white text-[13.5px] font-semibold hover:bg-[#0446b3] transition-colors w-full sm:w-auto justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Search Packages</span>
            </Link>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#dce7f5] bg-white hover:bg-[#f8fbff] text-[13.5px] font-semibold text-[#0f172a] transition-colors w-full sm:w-auto justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
            >
              <FileSearch className="h-4 w-4 text-[#0558d6]" aria-hidden="true" />
              <span>Scan a Manifest</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
