'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Ecosystem } from '@/lib/types';
import { BookOpen, FileSearch, Scale, Terminal } from 'lucide-react';

interface NavbarProps {
  onOpenCompare?: () => void;
}

export function Navbar({ onOpenCompare }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentEcosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const currentPackage = searchParams.get('package');
  const isDocsPage = pathname === '/docs';
  const isScanPage = pathname === '/scan';

  const switchEcosystem = (eco: Ecosystem) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('ecosystem', eco);
    if (currentPackage) {
      params.delete('package');
      params.delete('type');
      params.delete('version');
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="pointer-events-auto relative inline-flex max-w-full items-start">
      {/* Left inverted concave fillet ear merging notch flush into top screen edge */}
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        className="pointer-events-none absolute -left-[14px] top-0 hidden sm:block shrink-0"
      >
        <path d="M 0 0 L 14 0 L 14 14 A 14 14 0 0 0 0 0 Z" fill="#03050a" />
      </svg>

      {/* Main MacBook-style Apple Notch bar */}
      <nav
        aria-label="Primary"
        className="relative flex max-w-full items-center justify-between gap-2.5 sm:gap-6 bg-[#03050a] px-3 sm:px-4.5 py-2 sm:py-2.5 rounded-b-[18px] sm:rounded-b-[22px] text-white shadow-[0_14px_34px_-10px_rgba(3,18,56,0.5)]"
      >
        {/* Brand squircle icon + wordmark */}
        <Link
          href="/"
          aria-label="KnowYourDeps home"
          className="flex items-center gap-2 select-none rounded-lg pr-0.5 transition-opacity duration-150 hover:opacity-85 text-white shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8]"
        >
          <div
            aria-hidden="true"
            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-[8px] bg-gradient-to-b from-[#68c5ff] via-[#1a7bf8] to-[#0645b6] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),0_2px_8px_rgba(8,124,248,0.45)] shrink-0"
          >
            <Terminal className="h-3.5 w-3.5" />
          </div>
          <span
            className="hidden min-[440px]:inline font-display text-[14.5px] sm:text-[15.5px] font-semibold tracking-tight text-white"
            translate="no"
          >
            knowyourdeps
          </span>
        </Link>

        {/* Center quiet navigation & ecosystem controls */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <div
            role="group"
            aria-label="Select package ecosystem"
            className="flex items-center rounded-lg p-0.5 bg-white/[0.08] border border-white/10 shrink-0"
          >
            <button
              type="button"
              aria-pressed={currentEcosystem === 'npm'}
              onClick={() => switchEcosystem('npm')}
              translate="no"
              className={`flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11.5px] sm:text-[12px] font-medium rounded-md cursor-pointer select-none transition-[background-color,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] ${
                currentEcosystem === 'npm'
                  ? 'bg-[#087cf8] text-white font-semibold'
                  : 'text-[#a1a8b3] hover:text-white'
              }`}
            >
              npm
            </button>
            <button
              type="button"
              aria-pressed={currentEcosystem === 'pypi'}
              onClick={() => switchEcosystem('pypi')}
              translate="no"
              className={`flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11.5px] sm:text-[12px] font-medium rounded-md cursor-pointer select-none transition-[background-color,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] ${
                currentEcosystem === 'pypi'
                  ? 'bg-[#087cf8] text-white font-semibold'
                  : 'text-[#a1a8b3] hover:text-white'
              }`}
            >
              PyPI
            </button>
          </div>

          <Link
            href="/scan"
            aria-current={isScanPage ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] sm:text-[13px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] ${
              isScanPage ? 'text-white font-semibold' : 'text-[#a1a8b3] hover:text-white'
            }`}
          >
            <FileSearch className="h-3.5 w-3.5 shrink-0 sm:hidden" aria-hidden="true" />
            <span>Scan</span>
          </Link>

          <Link
            href="/docs"
            aria-current={isDocsPage ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] sm:text-[13px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] ${
              isDocsPage ? 'text-white font-semibold' : 'text-[#a1a8b3] hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0 sm:hidden" aria-hidden="true" />
            <span>Docs</span>
          </Link>
        </div>

        {/* Far-right bright white CTA pill (matches Apple Notch reference silhouette) */}
        <button
          type="button"
          onClick={() => {
            if (onOpenCompare) {
              onOpenCompare();
            } else {
              router.push(`/?compare=true&ecosystem=${currentEcosystem}`);
            }
          }}
          className="flex h-7.5 sm:h-8 cursor-pointer items-center gap-1.5 rounded-[9px] sm:rounded-[10px] bg-white hover:bg-[#e8f3ff] px-2.5 sm:px-3.5 text-[11.5px] sm:text-[12.5px] font-semibold text-[#03050a] shadow-xs transition-[background-color,transform] duration-150 active:scale-[0.97] shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8]"
        >
          <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Compare</span>
        </button>
      </nav>

      {/* Right inverted concave fillet ear merging notch flush into top screen edge */}
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        className="pointer-events-none absolute -right-[14px] top-0 hidden sm:block shrink-0"
      >
        <path d="M 0 0 L 14 0 A 14 14 0 0 0 0 14 Z" fill="#03050a" />
      </svg>
    </div>
  );
}
