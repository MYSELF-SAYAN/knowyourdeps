'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Search,
  Download,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { KeycapButton } from '@/components/ui/KeycapButton';
import type { ScanPackageResult } from '@/app/api/scan/route';
import type { Ecosystem } from '@/lib/types';

interface ScanResultTableProps {
  results: ScanPackageResult[];
  ecosystem: Ecosystem;
  fileName: string;
  summary: {
    total: number;
    safe: number;
    vulnerable: number;
    totalCves: number;
  };
  onExportPdf: () => void;
}

type StatusFilter = 'all' | 'vulnerable' | 'safe';

export function ScanResultTable({
  results,
  ecosystem,
  fileName,
  summary,
  onExportPdf,
}: ScanResultTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return results
      .filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (!q) return true;
        const matchesPkg = item.name.toLowerCase().includes(q);
        const matchesCve = item.cves.some(
          (c) =>
            c.id.toLowerCase().includes(q) ||
            c.osvId.toLowerCase().includes(q) ||
            c.summary.toLowerCase().includes(q)
        );
        return matchesPkg || matchesCve;
      })
      .sort((a, b) => {
        const rank = { vulnerable: 0, invalid: 1, safe: 2 };
        if (a.status !== b.status) return rank[a.status] - rank[b.status];
        return a.name.localeCompare(b.name);
      });
  }, [results, statusFilter, query]);

  return (
    <div className="space-y-6">
      {/* Summary Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-[#dce7f5] bg-[#f8fbff] p-4">
          <p className="text-[11.5px] font-medium uppercase tracking-wider text-[#64748b]">
            Packages
          </p>
          <p className="mt-1 font-display text-[24px] font-semibold text-[#0f172a] tabular-nums">
            {summary.total}
          </p>
        </div>

        <div className="rounded-2xl border border-[#bcf2ce] bg-[#eefcf3]/70 p-4">
          <p className="text-[11.5px] font-medium uppercase tracking-wider text-[#0d7a42]">
            Safe
          </p>
          <p className="mt-1 font-display text-[24px] font-semibold text-[#0d7a42] tabular-nums">
            {summary.safe}
          </p>
        </div>

        <div className="rounded-2xl border border-[#fcccd1] bg-[#feecee]/70 p-4">
          <p className="text-[11.5px] font-medium uppercase tracking-wider text-[#b82429]">
            Vulnerable
          </p>
          <p className="mt-1 font-display text-[24px] font-semibold text-[#b82429] tabular-nums">
            {summary.vulnerable}
          </p>
        </div>

        <div className="rounded-2xl border border-[#dce7f5] bg-[#f8fbff] p-4">
          <p className="text-[11.5px] font-medium uppercase tracking-wider text-[#64748b]">
            Total CVEs
          </p>
          <p className="mt-1 font-display text-[24px] font-semibold text-[#0f172a] tabular-nums">
            {summary.totalCves}
          </p>
        </div>
      </div>

      {/* Controls Bar: Filter Pills + Search + Export PDF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filter dependencies by security status"
            className="inline-flex items-center rounded-xl bg-[#f1f6fd] p-1 border border-[#dce7f5]"
          >
            {(['all', 'vulnerable', 'safe'] as StatusFilter[]).map((tab) => {
              const count =
                tab === 'all'
                  ? summary.total
                  : tab === 'vulnerable'
                  ? summary.vulnerable
                  : summary.safe;
              const isActive = statusFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium capitalize cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6] ${
                    isActive
                      ? 'bg-white text-[#0f172a] shadow-xs font-semibold'
                      : 'text-[#475569] hover:text-[#0f172a]'
                  }`}
                >
                  {tab} <span className="tabular-nums opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 sm:w-60 sm:flex-initial">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter package or CVE..."
              aria-label="Filter results by package name or CVE ID"
              className="w-full h-9 pl-8.5 pr-8 rounded-xl border border-[#dce7f5] bg-white text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#087cf8] focus:outline-none focus:ring-2 focus:ring-[#087cf8]/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <KeycapButton
          type="button"
          variant="primary"
          size="sm"
          onClick={onExportPdf}
          aria-label={`Export ${fileName} CVE scan results to PDF`}
          className="gap-2 w-full sm:w-auto"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Export PDF</span>
        </KeycapButton>
      </div>

      {/* Results Table */}
      <div className="overflow-hidden rounded-2xl border border-[#dce7f5] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#dce7f5] bg-[#f8fbff] text-[11.5px] font-semibold uppercase tracking-wider text-[#475569]">
                <th scope="col" className="py-3.5 px-4 sm:px-5">
                  Package
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Version
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Status
                </th>
                <th scope="col" className="py-3.5 px-4 sm:px-5">
                  CVEs
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef4fb] text-[13.5px]">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 px-5 text-center text-[#64748b]">
                    No packages match the current filter.
                  </td>
                </tr>
              ) : (
                filteredResults.map((pkg) => {
                  const hasConcreteVersion =
                    Boolean(pkg.version) &&
                    pkg.version !== 'unpinned' &&
                    pkg.version !== 'latest';
                  const packageHref = `/?ecosystem=${ecosystem}&package=${encodeURIComponent(pkg.name)}${
                    hasConcreteVersion ? `&version=${encodeURIComponent(pkg.version)}` : ''
                  }&type=overview`;

                  return (
                  <tr
                    key={`${pkg.name}-${pkg.version}`}
                    className="transition-colors duration-100 hover:bg-[#f8fbff]/80"
                  >
                    <td className="py-3.5 px-4 sm:px-5 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={packageHref}
                          aria-label={`Inspect ${pkg.name}${hasConcreteVersion ? ` version ${pkg.version}` : ''} in search`}
                          className="font-semibold text-[#0f172a] hover:text-[#0558d6] transition-colors inline-flex items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
                        >
                          <span>{pkg.name}</span>
                          <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />
                        </Link>
                        {pkg.section === 'devDependencies' && (
                          <span className="px-1.5 py-0.5 text-[10.5px] font-mono rounded bg-[#f1f5f9] text-[#475569]">
                            dev
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="inline-block font-mono text-[12px] text-[#334155] bg-[#f1f6fd] border border-[#dce7f5] px-2 py-0.5 rounded-md tabular-nums">
                        {pkg.version}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      {pkg.status === 'safe' ? (
                        <Badge variant="success" size="sm">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Safe</span>
                        </Badge>
                      ) : pkg.status === 'invalid' ? (
                        <Badge variant="warning" size="sm">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Not Found</span>
                        </Badge>
                      ) : (
                        <Badge variant="vulnerable" size="sm">
                          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Vulnerable</span>
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-5 align-top">
                      {pkg.status === 'invalid' ? (
                        <span className="text-[12.5px] text-[#92400e]">
                          {pkg.invalidReason || 'Package not found in registry (skipped)'}
                        </span>
                      ) : pkg.cves.length === 0 ? (
                        <span className="text-[12.5px] text-[#64748b]">No known CVEs</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {pkg.cves.map((cve) => (
                            <div
                              key={`${cve.osvId}-${cve.id}`}
                              className="inline-flex items-center rounded-md border border-[#fcccd1] bg-[#fff5f6] overflow-hidden"
                            >
                              <a
                                href={cve.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`${cve.summary} — Verify on OSV.dev`}
                                aria-label={`Verify ${cve.id} (${cve.severity}) on OSV.dev`}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 hover:bg-[#feecee] text-[11.5px] font-mono font-medium text-[#b82429] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b82429]"
                              >
                                <span>{cve.id}</span>
                                <span className="text-[10px] font-sans font-semibold uppercase opacity-80">
                                  {cve.severity}
                                </span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-70" aria-hidden="true" />
                              </a>
                              {cve.id.startsWith('CVE-') && (
                                <a
                                  href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(cve.id)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Verify ${cve.id} on NVD`}
                                  aria-label={`Verify ${cve.id} on NVD`}
                                  className="px-1.5 py-0.5 border-l border-[#fcccd1] bg-[#feecee]/60 hover:bg-[#feecee] text-[10px] font-sans font-semibold text-[#991b1b] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b82429]"
                                >
                                  NVD
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
