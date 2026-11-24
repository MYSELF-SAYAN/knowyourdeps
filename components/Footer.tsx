'use client';

import React from 'react';
import Link from 'next/link';

interface FooterProps {
  onOpenCompare?: () => void;
}

export function Footer({ onOpenCompare }: FooterProps) {
  return (
    <footer className="w-full border-t border-[#e2e8f0]/80 bg-white/60 backdrop-blur-md py-6 mt-auto text-[12px] text-[#64748b] relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="font-display font-bold text-[16px] text-[#0f172a] tracking-tight hover:text-[#1d53c6] transition-colors"
          >
            KNOWYOURDEPS
          </Link>
          <span>•</span>
          <span>Package intelligence &amp; supply chain audit engine</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="text-[#64748b] hidden md:inline">Zero browser calls to external third-party APIs</span>
          <span className="hidden md:inline">•</span>
          <Link href="/docs" className="hover:text-[#1d53c6] transition-colors">
            Docs
          </Link>
          <span>•</span>
          {onOpenCompare ? (
            <button
              type="button"
              onClick={onOpenCompare}
              className="text-[#1d53c6] hover:underline font-medium cursor-pointer"
            >
              Compare Packages
            </button>
          ) : (
            <Link
              href="/?compare=true"
              className="text-[#1d53c6] hover:underline font-medium"
            >
              Compare Packages
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
