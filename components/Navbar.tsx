'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ecosystem } from '@/lib/types';
import { Scale, Terminal } from 'lucide-react';

interface NavbarProps {
  onOpenCompare?: () => void;
}

export function Navbar({ onOpenCompare }: NavbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentEcosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const currentPackage = searchParams.get('package');

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
    <nav className="pointer-events-auto flex items-center justify-between gap-3 sm:gap-6 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/80 backdrop-blur-xl border border-[rgba(0,0,0,0.07)] shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 animate-in fade-in slide-in-from-top-2">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2 text-[15px] font-bold tracking-[-0.03em] text-[#0e0f12] hover:opacity-80 transition-opacity select-none"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0033ff] text-white shadow-[0_1px_3px_rgba(0,51,255,0.4)]">
          <Terminal className="h-3 w-3" />
        </div>
        <span>depsdive</span>
      </Link>

      {/* Animated Ecosystem Toggle Pill */}
      <div className="relative flex items-center rounded-full bg-[#00000008] p-1 border border-[#00000006]">
        <button
          type="button"
          onClick={() => switchEcosystem('npm')}
          className={`relative z-10 flex items-center px-3 py-1 text-[12px] font-semibold transition-all duration-150 rounded-full cursor-pointer select-none active:scale-[0.96] ${
            currentEcosystem === 'npm'
              ? 'bg-white text-[#0033ff] shadow-xs font-bold'
              : 'text-[#6e6e6e] hover:text-[#1a1a1a]'
          }`}
        >
          <span>npm</span>
        </button>
        <button
          type="button"
          onClick={() => switchEcosystem('pypi')}
          className={`relative z-10 flex items-center px-3 py-1 text-[12px] font-semibold transition-all duration-150 rounded-full cursor-pointer select-none active:scale-[0.96] ${
            currentEcosystem === 'pypi'
              ? 'bg-white text-[#0033ff] shadow-xs font-bold'
              : 'text-[#6e6e6e] hover:text-[#1a1a1a]'
          }`}
        >
          <span>PyPI</span>
        </button>
      </div>

      {/* Right Quick Actions (Compare & API docs - Search removed as requested) */}
      <div className="flex items-center gap-2">
        {onOpenCompare && (
          <button
            type="button"
            onClick={onOpenCompare}
            className="flex h-7.5 sm:h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[#f4f6fb] hover:bg-[#ebefff] border border-[rgba(0,0,0,0.06)] px-3 text-[12px] font-semibold text-[#1a1a1a] transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.96] shadow-xs"
          >
            <Scale className="h-3.5 w-3.5 text-[#0033ff]" />
            <span>Compare</span>
          </button>
        )}

        <Link
          href="https://docs.deps.dev/api/v3/"
          target="_blank"
          rel="noreferrer"
          className="text-[12px] font-medium text-[#7d879b] hover:text-[#0033ff] transition-colors max-sm:hidden px-2"
        >
          deps.dev v3
        </Link>
      </div>
    </nav>
  );
}
