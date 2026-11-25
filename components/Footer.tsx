'use client';

import React from 'react';
import Link from 'next/link';

interface FooterProps {
  onOpenCompare?: () => void;
}

export function Footer({ onOpenCompare }: FooterProps) {
  return (
    <footer className="w-full border-t border-[#cde3fa] bg-white/75 backdrop-blur-md py-6 mt-auto text-[13px] text-[#475569] relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <Link
            href="/"
            translate="no"
            className="font-display font-semibold text-[15px] text-[#0f172a] tracking-tight hover:text-[#0558d6] transition-colors duration-150 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
          >
            knowyourdeps
          </Link>
          <span aria-hidden="true" className="text-[#94a3b8]">·</span>
          <span>Package security, CVE audits &amp; dependency intelligence</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <span className="text-[#475569] hidden md:inline">Server-proxied OSV, deps.dev &amp; registry telemetry</span>
          <span aria-hidden="true" className="hidden md:inline text-[#94a3b8]">·</span>
          <Link
            href="/docs"
            className="hover:text-[#0558d6] transition-colors duration-150 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
          >
            Docs
          </Link>
          <span aria-hidden="true" className="text-[#94a3b8]">·</span>
          {onOpenCompare ? (
            <button
              type="button"
              onClick={onOpenCompare}
              className="text-[#0558d6] hover:underline font-medium cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
            >
              Compare Packages
            </button>
          ) : (
            <Link
              href="/?compare=true"
              className="text-[#0558d6] hover:underline font-medium rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
            >
              Compare Packages
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
