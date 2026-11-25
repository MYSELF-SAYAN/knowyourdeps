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
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
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
      <form onSubmit={handleSubmit} className="relative w-full" role="search">
        <label htmlFor="pkg-search-input" className="sr-only">
          Search {ecosystem} packages
        </label>
        <div
          className={`relative flex items-center w-full transition-[border-color,box-shadow,background-color] duration-150 bg-white ${
            compact
              ? 'h-11 sm:h-12 rounded-2xl shadow-[0_2px_10px_rgba(15,23,42,0.06)]'
              : 'h-13 sm:h-14 rounded-2xl shadow-[0_22px_54px_-12px_rgba(3,28,77,0.34)]'
          } ${
            isOpen
              ? 'border border-[#087cf8] ring-4 ring-[#087cf8]/20'
              : 'border border-white/85 hover:border-[#93c5fd] focus-within:border-[#087cf8] focus-within:ring-4 focus-within:ring-[#087cf8]/20'
          }`}
        >
          <div className="flex pl-4 pr-2.5 text-[#64748b] shrink-0" aria-hidden="true">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#0558d6]" />
            ) : (
              <Search className="h-4 w-4 text-[#475569]" />
            )}
          </div>

          <input
            id="pkg-search-input"
            ref={inputRef}
            name="package"
            type="text"
            value={query}
            autoComplete="off"
            spellCheck={false}
            aria-label={`Search ${ecosystem} packages`}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={`Search ${ecosystem === 'npm' ? 'npm package (e.g. axios, @scope/pkg)' : 'PyPI package (e.g. requests, fastapi)'}…`}
            className="w-full min-w-0 bg-transparent pr-2 text-[14px] sm:text-[15px] text-[#0f172a] placeholder-[#64748b] focus:outline-none"
          />

          <div className="pr-3 flex items-center gap-2 shrink-0">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search query"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] hover:text-[#0f172a] transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}

            {!isOpen && !query && (
              <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 font-mono text-[10px] font-medium text-[#475569] bg-[#f8fafc] border border-[#dce7f5] rounded-md">
                /
              </kbd>
            )}

            <span
              className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#0558d6] border border-[#bfdbfe] uppercase"
              translate="no"
            >
              {ecosystem}
            </span>
          </div>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[380px] overflow-y-auto overscroll-contain rounded-2xl border border-[#dce7f5] bg-white p-2 shadow-[0_24px_56px_-12px_rgba(3,28,77,0.28)]">
          {loading && results.length === 0 ? (
            <div className="flex flex-col gap-1 p-1">
              <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#0558d6] flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Searching {ecosystem} registry…
              </span>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="h-4 w-36 bg-[#f1f5f9] rounded" />
                    <div className="h-3 w-52 bg-[#f1f5f9] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                Matching {ecosystem} Packages
              </span>
              {results.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => selectPackage(r.name)}
                  className="flex items-center justify-between gap-3 rounded-xl p-2.5 text-left transition-colors duration-150 hover:bg-[#eff6ff] group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0558d6]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1f6fd] group-hover:bg-white text-[#475569] group-hover:text-[#0558d6]">
                      <PackageIcon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-[14px] text-[#0f172a] group-hover:text-[#0558d6] truncate">
                          {r.name}
                        </span>
                        <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 font-mono text-[10px] text-[#475569] tabular-nums shrink-0">
                          v{r.version}
                        </span>
                      </div>
                      {r.description && (
                        <p className="line-clamp-1 text-[12px] text-[#475569]">
                          {r.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 text-[#64748b] opacity-0 group-hover:opacity-100 group-hover:text-[#0558d6] transition-opacity duration-150 shrink-0"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-[13px] text-[#475569]">
              Press <kbd className="rounded border border-[#dce7f5] bg-[#f8fafc] px-1.5 py-0.5 font-mono text-[11px]">Enter</kbd> to inspect{' '}
              <strong className="text-[#0f172a] font-semibold">{query}</strong>
            </div>
          ) : (
            <div className="p-2">
              <span className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                Popular {ecosystem} Packages
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {POPULAR_SUGGESTIONS[ecosystem].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => selectPackage(s)}
                    translate="no"
                    className="rounded-lg border border-[#dce7f5] bg-[#f8fbff] px-2.5 py-1 text-[12px] font-medium text-[#0f172a] hover:bg-[#eff6ff] hover:border-[#93c5fd] hover:text-[#0558d6] transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
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
