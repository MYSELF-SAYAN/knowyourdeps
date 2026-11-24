'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Ecosystem } from '@/lib/types';
import { BookOpen, Scale, Terminal } from 'lucide-react';

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

  const switchEcosystem = (eco: Ecosystem) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('ecosystem', eco);
    if (!currentPackage) {
      router.push(`/?${params.toString()}`);
    } else {
      // Clear package if switching ecosystem since package names differ
      params.delete('package');
      params.delete('type');
      router.push(`/?${params.toString()}`);
    }
  };

  return (
    <nav className="pointer-events-auto flex items-center justify-between gap-3 sm:gap-6 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(14,165,233,0.12),0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 animate-in fade-in slide-in-from-top-2">
      {/* Brand with first pixelated display font */}
      <Link
        href="/"
        className="flex items-center gap-2 text-[#0f172a] hover:opacity-85 transition-opacity select-none group"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#1d53c6] text-white shadow-[0_2px_6px_rgba(2,132,199,0.35)]">
          <Terminal className="h-3 w-3" />
        </div>
        <span className="font-display text-[19px] font-bold tracking-tight text-[#0f172a]">
          knowyourdeps
        </span>
      </Link>

      {/* Animated Ecosystem Toggle Pill */}
      <div className="relative flex items-center rounded-full bg-[#eff6ff] p-1 border border-[#bfdbfe]/50">
        <button
          type="button"
          onClick={() => switchEcosystem('npm')}
          className={`relative z-10 flex items-center px-3 py-1 text-[12px] font-semibold transition-all duration-150 rounded-full cursor-pointer select-none active:scale-[0.96] ${
            currentEcosystem === 'npm'
              ? 'bg-[#1d53c6] text-white shadow-xs font-bold'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <span>npm</span>
        </button>
        <button
          type="button"
          onClick={() => switchEcosystem('pypi')}
          className={`relative z-10 flex items-center px-3 py-1 text-[12px] font-semibold transition-all duration-150 rounded-full cursor-pointer select-none active:scale-[0.96] ${
            currentEcosystem === 'pypi'
              ? 'bg-[#1d53c6] text-white shadow-xs font-bold'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <span>PyPI</span>
        </button>
      </div>

      {/* Right Quick Actions (Compare, Docs & External API) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/docs"
          className={`flex h-7.5 sm:h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.96] shadow-xs ${
            isDocsPage
              ? 'bg-[#1d53c6] text-white border border-[#1d53c6]'
              : 'bg-[#f8fafc] hover:bg-[#eff6ff] border border-[#e2e8f0] hover:border-[#bfdbfe] text-[#0f172a] hover:text-[#1d53c6]'
          }`}
          title="MCP Server & Agent Skills Documentation"
        >
          <BookOpen className={`h-3.5 w-3.5 ${isDocsPage ? 'text-white' : 'text-[#1d53c6]'}`} />
          <span>Docs</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            if (onOpenCompare) {
              onOpenCompare();
            } else {
              router.push(`/?compare=true&ecosystem=${currentEcosystem}`);
            }
          }}
          className="flex h-7.5 sm:h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[#f8fafc] hover:bg-[#eff6ff] border border-[#e2e8f0] hover:border-[#bfdbfe] px-3 text-[12px] font-semibold text-[#0f172a] hover:text-[#1d53c6] transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.96] shadow-xs"
          title="Compare Packages Side-by-Side"
        >
          <Scale className="h-3.5 w-3.5 text-[#1d53c6]" />
          <span>Compare</span>
        </button>

        <Link
          href="https://docs.deps.dev/api/v3/"
          target="_blank"
          rel="noreferrer"
          className="text-[12px] font-medium text-[#64748b] hover:text-[#1d53c6] transition-colors max-sm:hidden px-2"
        >
          deps.dev v3
        </Link>
      </div>
    </nav>
  );
}
