'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2, Package as PackageIcon, ArrowRight, X } from 'lucide-react';
import { Ecosystem, SearchResultItem } from '@/lib/types';

interface SearchBarProps {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  compact?: boolean;
}

const POPULAR_SUGGESTIONS: Record<Ecosystem, string[]> = {
  npm: ['axios', 'express', 'react', 'zod', 'next', 'lodash', 'tailwindcss', 'fastify'],
  pypi: ['requests', 'fastapi', 'flask', 'pydantic', 'pandas', 'numpy', 'httpx', 'pytest'],
};

export function SearchBar({ inputRef: externalRef, compact = false }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ecosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const currentPkg = searchParams.get('package') || '';

  const [query, setQuery] = useState(currentPkg);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || internalRef;
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query when searchParams change
  useEffect(() => {
    setQuery(currentPkg);
  }, [currentPkg]);

  // Global '/' keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputRef]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results on debounce
  useEffect(() => {
    if (!query.trim() || query === currentPkg) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?ecosystem=${ecosystem}&q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, ecosystem, currentPkg]);

  const selectPackage = (pkgName: string) => {
    setIsOpen(false);
    setQuery(pkgName);
    const params = new URLSearchParams(searchParams.toString());
    params.set('ecosystem', ecosystem);
    params.set('package', pkgName);
    params.set('type', 'overview');
    router.push(`/?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      selectPackage(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={`relative flex items-center w-full transition-all duration-200 bg-white ${
            compact
              ? 'h-11 sm:h-12 rounded-[18px] shadow-[0_2px_10px_rgba(29,83,198,0.06),0_1px_2px_rgba(0,0,0,0.04)]'
              : 'h-13 sm:h-14 rounded-[22px] shadow-[0_4px_24px_rgba(29,83,198,0.09),0_1px_3px_rgba(0,0,0,0.04)]'
          } ${
            isOpen
              ? 'border border-[#1d53c6] ring-4 ring-[#1d53c6]/10'
              : 'border border-[#e2e8f0] hover:border-[#93c5fd]'
          }`}
        >
          <div className="flex pl-4 pr-2 text-[#94a3b8]">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#1d53c6]" />
            ) : (
              <Search className="h-4 w-4 text-[#64748b]" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={`Search ${ecosystem === 'npm' ? 'npm package (e.g. axios, @scope/pkg)' : 'PyPI package (e.g. requests, fastapi)'}...`}
            className="w-full bg-transparent pr-2 text-[14px] sm:text-[15px] text-[#0f172a] placeholder-[#94a3b8] focus:outline-none"
          />

          <div className="pr-3 flex items-center gap-2">
            {/* Clear Query Button */}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer"
                title="Clear input"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Keyboard shortcut hint */}
            {!isOpen && !query && (
              <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 font-mono text-[10px] text-[#94a3b8] bg-[#f8fafc] border border-[#e2e8f0] rounded-[5px]">
                /
              </kbd>
            )}

            {/* Ecosystem pill */}
            <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#1d53c6] border border-[#bfdbfe]/60 uppercase">
              {ecosystem}
            </span>
          </div>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[380px] overflow-y-auto rounded-[18px] border border-[#e2e8f0] bg-white/95 backdrop-blur-md p-2 shadow-[0_16px_40px_rgba(14,165,233,0.08)] animate-in fade-in zoom-in-95 duration-150 origin-top">
          {loading && results.length === 0 ? (
            <div className="flex flex-col gap-1 p-1 animate-in fade-in duration-100">
              <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#1d53c6] flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" /> Searching {ecosystem} registry...
              </span>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-[10px] animate-pulse">
                  <div className="w-8 h-8 rounded-[8px] bg-[#f0f0f0] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-36 bg-[#f0f0f0] rounded" />
                    <div className="h-3 w-52 bg-[#f0f0f0] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                Matching {ecosystem} Packages
              </span>
              {results.map((r) => (
                <button
                  key={r.name}
                  onClick={() => selectPackage(r.name)}
                  className="flex items-center justify-between rounded-[10px] p-2.5 text-left transition-colors hover:bg-[#eff6ff] group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#f8fafc] group-hover:bg-white text-[#64748b] group-hover:text-[#1d53c6]">
                      <PackageIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[14px] text-[#0f172a] group-hover:text-[#1d53c6]">
                          {r.name}
                        </span>
                        <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 font-mono text-[10px] text-[#64748b]">
                          v{r.version}
                        </span>
                      </div>
                      {r.description && (
                        <p className="line-clamp-1 text-[12px] text-[#64748b]">
                          {r.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#94a3b8] opacity-0 group-hover:opacity-100 group-hover:text-[#1d53c6] transition-opacity" />
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-[13px] text-[#64748b]">
              Press <kbd className="rounded border bg-[#f8fafc] px-1.5 py-0.5 font-mono text-[11px]">Enter</kbd> to inspect <strong className="text-[#0f172a] font-semibold">{query}</strong>
            </div>
          ) : (
            <div className="p-2">
              <span className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                Popular {ecosystem} Packages
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {POPULAR_SUGGESTIONS[ecosystem].map((s) => (
                  <button
                    key={s}
                    onClick={() => selectPackage(s)}
                    className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-[12px] font-medium text-[#0f172a] hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:text-[#1d53c6] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
