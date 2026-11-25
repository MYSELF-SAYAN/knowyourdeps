'use client';

import React, { useEffect, useState } from 'react';
import {
  Ecosystem,
  DependencyData,
  AlternativePackage,
} from '@/lib/types';
import {
  Boxes,
  Layers,
  Shuffle,
  GitFork,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Scale,
  Star,
  Download,
  AlertTriangle,
  RefreshCw,
  Package as PackageIcon,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { KeycapButton } from '../ui/KeycapButton';
import Link from 'next/link';

interface EcosystemTabProps {
  ecosystem: Ecosystem;
  packageName: string;
  version: string;
  onCompareWith?: (targetPackage: string) => void;
  initialSubTab?: 'dependencies' | 'alternatives';
}

export function EcosystemTab({
  ecosystem,
  packageName,
  version,
  onCompareWith,
  initialSubTab = 'dependencies',
}: EcosystemTabProps) {
  // Sub-view toggle: 'dependencies' vs 'alternatives'
  const [subView, setSubView] = useState<'dependencies' | 'alternatives'>(initialSubTab);

  // Dependencies state
  const [depData, setDepData] = useState<DependencyData | null>(null);
  const [depLoading, setDepLoading] = useState(true);
  const [depError, setDepError] = useState<string | null>(null);
  const [depSearch, setDepSearch] = useState('');
  const [depTreeMode, setDepTreeMode] = useState<'requirements' | 'graph'>('requirements');

  // Alternatives state
  const [alternatives, setAlternatives] = useState<AlternativePackage[]>([]);
  const [altLoading, setAltLoading] = useState(true);
  const [altError, setAltError] = useState<string | null>(null);

  // Fetch dependencies
  useEffect(() => {
    let isMounted = true;
    setDepLoading(true);
    setDepError(null);

    fetch(
      `/api/package/dependencies?ecosystem=${ecosystem}&name=${encodeURIComponent(
        packageName
      )}&version=${encodeURIComponent(version)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dependency graph');
        return res.json();
      })
      .then((json: DependencyData) => {
        if (!isMounted) return;
        setDepData(json);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setDepError(err.message || 'Error loading dependencies');
      })
      .finally(() => {
        if (isMounted) setDepLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ecosystem, packageName, version]);

  // Fetch alternatives
  useEffect(() => {
    let isMounted = true;
    setAltLoading(true);
    setAltError(null);

    fetch(
      `/api/package/alternatives?ecosystem=${ecosystem}&name=${encodeURIComponent(packageName)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load alternative recommendations');
        return res.json();
      })
      .then((json) => {
        if (!isMounted) return;
        setAlternatives(Array.isArray(json) ? json : json.alternatives || []);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setAltError(err.message || 'Error loading alternatives');
      })
      .finally(() => {
        if (isMounted) setAltLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ecosystem, packageName]);

  const functionalAlternatives = alternatives.filter((a) => a.matchType === 'functional');
  const typosquats = alternatives.filter((a) => a.matchType === 'name-similar');

  const filteredRequirements =
    depData?.requirements.filter((req) =>
      req.name.toLowerCase().includes(depSearch.toLowerCase())
    ) || [];

  const filteredGraph =
    depData?.resolvedGraph?.filter((node) =>
      node.name.toLowerCase().includes(depSearch.toLowerCase())
    ) || [];

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '—';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="flex flex-col gap-6 animate-tab-in">
      {/* Blended Header: High-level Ecosystem Overview Card */}
      <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] p-6 shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-[#eff6ff] text-[#0558d6] flex items-center justify-center border border-[#bfdbfe]">
                <Boxes className="h-5 w-5" />
              </div>
              <h3 className="font-sans font-bold text-[18px] text-[#0f172a]">
                Ecosystem & Supply Chain
              </h3>
              <Badge variant="accent" size="sm">
                v{version}
              </Badge>
            </div>
            <p className="text-[13px] text-[#475569] mt-1.5 max-w-2xl leading-relaxed">
              Explore runtime dependency requirements, resolved supply chain graph, and vetted alternative packages for{' '}
              <strong className="font-mono text-[#0f172a]">{packageName}</strong>.
            </p>
          </div>

          {/* Sub-view Switcher Tabs */}
          <div className="flex items-center p-1 bg-[#f1f6fd] rounded-[12px] border border-[#dce7f5] shrink-0 self-stretch lg:self-auto">
            <button
              type="button"
              onClick={() => setSubView('dependencies')}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-[9px] text-[13px] font-semibold transition-[background-color,color,transform] duration-150 cursor-pointer select-none active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6] ${
                subView === 'dependencies'
                  ? 'bg-white text-[#0558d6] shadow-xs'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              <Layers className="h-4 w-4" aria-hidden="true" />
              <span>Dependencies</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                  subView === 'dependencies' ? 'bg-[#eff6ff] text-[#0558d6] font-bold' : 'bg-[#e2e8f0] text-[#475569]'
                }`}
              >
                {depLoading ? '…' : depData?.totalDirect ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubView('alternatives')}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-[9px] text-[13px] font-semibold transition-[background-color,color,transform] duration-150 cursor-pointer select-none active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6] ${
                subView === 'alternatives'
                  ? 'bg-white text-[#0558d6] shadow-xs'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              <Shuffle className="h-4 w-4" aria-hidden="true" />
              <span>Alternatives</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                  subView === 'alternatives' ? 'bg-[#eff6ff] text-[#0558d6] font-bold' : 'bg-[#e2e8f0] text-[#475569]'
                }`}
              >
                {altLoading ? '…' : functionalAlternatives.length}
              </span>
            </button>
          </div>
        </div>

        {/* Top 3 Quick KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#e8eef7]">
          {/* Direct Dependencies */}
          <div className="p-3.5 bg-[#f8fbff] border border-[#dce7f5] rounded-[14px] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">
                Direct Dependencies
              </span>
              <span className="font-display text-[22px] font-bold text-[#0f172a] tabular-nums">
                {depLoading ? '…' : depData?.totalDirect ?? 0}
              </span>
            </div>
            <Layers className="h-5 w-5 text-[#0558d6]" />
          </div>

          {/* Transitive Resolved Graph */}
          <div className="p-3.5 bg-[#f8fbff] border border-[#dce7f5] rounded-[14px] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">
                Resolved Graph Nodes
              </span>
              <span className="font-display text-[22px] font-bold text-[#0f172a] tabular-nums">
                {depLoading ? '…' : depData?.totalTransitive ?? depData?.resolvedGraph?.length ?? 0}
              </span>
            </div>
            <GitFork className="h-5 w-5 text-[#0558d6]" />
          </div>

          {/* Alternatives & Safety */}
          <div className="p-3.5 bg-[#f8fbff] border border-[#dce7f5] rounded-[14px] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">
                Vetted Alternatives
              </span>
              <span className="font-display text-[22px] font-bold text-[#0f172a] tabular-nums">
                {altLoading ? '…' : functionalAlternatives.length}
              </span>
            </div>
            <Shuffle className="h-5 w-5 text-[#0558d6]" />
          </div>
        </div>
      </div>

      {/* ===================== VIEW 1: DEPENDENCIES ===================== */}
      {subView === 'dependencies' && (
        <div className="flex flex-col gap-4">
          {/* Control Bar: View Mode Switcher + Live Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/92 backdrop-blur-xl border border-white/90 p-3 rounded-[16px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <div className="flex items-center bg-[#f1f6fd] p-1 rounded-[10px] self-start sm:self-auto border border-[#dce7f5]">
              <button
                type="button"
                onClick={() => setDepTreeMode('requirements')}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0558d6] ${
                  depTreeMode === 'requirements'
                    ? 'bg-white text-[#0558d6] shadow-xs'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                Direct Requirements ({depData?.totalDirect ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setDepTreeMode('graph')}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0558d6] ${
                  depTreeMode === 'graph'
                    ? 'bg-white text-[#0558d6] shadow-xs'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                Resolved Graph Tree ({depData?.totalTransitive ?? depData?.resolvedGraph?.length ?? 0})
              </button>
            </div>

            {/* Filter Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" aria-hidden="true" />
              <input
                type="text"
                name="dependency-filter"
                aria-label="Filter dependencies by name"
                autoComplete="off"
                spellCheck={false}
                value={depSearch}
                onChange={(e) => setDepSearch(e.target.value)}
                placeholder="Filter dependencies…"
                className="w-full pl-9 pr-3 py-1.5 text-[12px] bg-[#f8fbff] border border-[#dce7f5] rounded-[8px] focus:outline-none focus:border-[#087cf8] focus:ring-2 focus:ring-[#087cf8]/20 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Loading Skeleton */}
          {depLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] flex items-center justify-between animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#e8eef7]" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-[#e8eef7] rounded" />
                      <div className="h-3 w-20 bg-[#e8eef7] rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-[#e8eef7] rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {depError && !depLoading && (
            <div className="p-6 bg-[#feecee] border border-[#fcccd1] rounded-[16px] text-[#e5484d] flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-[14px]">Unable to load dependency graph</p>
                <p className="text-[12px] opacity-90">{depError}</p>
              </div>
            </div>
          )}

          {/* Zero Dependencies Clean State */}
          {!depLoading && !depError && (depData?.totalDirect ?? 0) === 0 && (
            <div className="p-8 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] text-center flex flex-col items-center justify-center shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
              <div className="w-12 h-12 rounded-full bg-[#eefcf3] text-[#17a45c] flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="font-sans font-bold text-[16px] text-[#0f172a]">Zero Runtime Dependencies</h4>
              <p className="text-[13px] text-[#475569] max-w-[420px] mt-1">
                <strong className="font-mono text-[#0f172a]">{packageName}</strong> has no declared runtime dependencies. It runs completely standalone with zero external supply-chain surface area.
              </p>
            </div>
          )}

          {/* Requirements View */}
          {!depLoading && !depError && depTreeMode === 'requirements' && filteredRequirements.length > 0 && (
            <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] overflow-hidden shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
              <div className="divide-y divide-[#e8eef7]">
                {filteredRequirements.map((req) => (
                  <div
                    key={req.name}
                    className="p-4 flex items-center justify-between hover:bg-[#f8fbff] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[8px] bg-[#eff6ff] text-[#0558d6] flex items-center justify-center shrink-0">
                        <PackageIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/?ecosystem=${ecosystem}&package=${encodeURIComponent(req.name)}`}
                            className="font-mono font-semibold text-[14px] text-[#0f172a] hover:text-[#0558d6] transition-colors"
                          >
                            {req.name}
                          </Link>
                          <span className="font-mono text-[11px] text-[#64748b] bg-[#f1f6fd] px-2 py-0.5 rounded-[6px]">
                            {req.constraint || 'latest'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/?ecosystem=${ecosystem}&package=${encodeURIComponent(req.name)}`}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-[8px] hover:bg-white text-[#64748b] hover:text-[#0558d6] transition-[background-color,border-color,color,box-shadow,transform,opacity]"
                        title={`Inspect ${req.name}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graph View */}
          {!depLoading && !depError && depTreeMode === 'graph' && filteredGraph.length > 0 && (
            <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] p-5 shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e8eef7] text-[12px] text-[#64748b]">
                <span>Resolved Dependency Tree</span>
                <span>{filteredGraph.length} resolved nodes</span>
              </div>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredGraph.map((node, idx) => (
                  <div
                    key={`${node.name}-${node.version}-${idx}`}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-[8px] hover:bg-[#f8fbff] text-[13px] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GitFork className="h-3 w-3 text-[#94a3b8] -rotate-90 shrink-0" />
                      <Link
                        href={`/?ecosystem=${ecosystem}&package=${encodeURIComponent(node.name)}`}
                        className="font-mono font-medium text-[#0f172a] hover:text-[#0558d6]"
                      >
                        {node.name}
                      </Link>
                      <span className="text-[11px] text-[#64748b] font-mono">v{node.version}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-semibold text-[#94a3b8] px-1.5 py-0.5 rounded bg-[#f1f6fd]">
                        {node.relation || 'resolved'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== VIEW 2: ALTERNATIVES ===================== */}
      {subView === 'alternatives' && (
        <div className="flex flex-col gap-4">
          {/* Typosquat Warning Banner */}
          {typosquats.length > 0 && !altLoading && (
            <div className="bg-[#fff8eb] border border-[#fed59b] rounded-[18px] p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-[#f76808] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-sans font-bold text-[15px] text-[#78350f]">
                    Typosquat & Similar Package Names Warning
                  </h4>
                  <p className="text-[12px] text-[#92400e] mt-1 leading-relaxed">
                    The following packages have names almost identical to{' '}
                    <strong className="font-mono">{packageName}</strong> (Levenshtein distance ≤ 2). Always verify exact spelling in your package manifest to prevent malicious supply chain attacks.
                  </p>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {typosquats.map((typo) => (
                      <div
                        key={typo.name}
                        className="flex items-center justify-between p-2 rounded-[8px] bg-white border border-[#fed59b] text-[12px]"
                      >
                        <span className="font-mono font-bold text-[#b45309] truncate">{typo.name}</span>
                        <span className="text-[10px] text-[#92400e]">{typo.latestVersion ? `v${typo.latestVersion}` : 'typosquat'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {altLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-5 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] space-y-3 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-32 bg-[#e8eef7] rounded" />
                    <div className="h-8 w-24 bg-[#e8eef7] rounded-[10px]" />
                  </div>
                  <div className="h-3.5 w-3/4 bg-[#e8eef7] rounded" />
                  <div className="h-4 w-1/3 bg-[#e8eef7] rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Error View */}
          {altError && !altLoading && (
            <div className="p-6 bg-[#feecee] border border-[#fcccd1] rounded-[16px] text-[#e5484d] flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-[14px]">Unable to load alternative recommendations</p>
                <p className="text-[12px] opacity-90">{altError}</p>
              </div>
            </div>
          )}

          {/* Alternatives Cards List */}
          {!altLoading && !altError && functionalAlternatives.length > 0 && (
            <div className="grid grid-cols-1 gap-3.5">
              {functionalAlternatives.map((alt) => (
                <div
                  key={alt.name}
                  className="p-5 bg-white/92 backdrop-blur-xl border border-white/90 hover:border-[#93c5fd] rounded-[18px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)] transition-[background-color,border-color,color,box-shadow,transform,opacity] flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Link
                        href={`/?ecosystem=${ecosystem}&package=${encodeURIComponent(alt.name)}`}
                        className="font-mono font-bold text-[16px] text-[#0f172a] hover:text-[#0558d6] transition-colors"
                      >
                        {alt.name}
                      </Link>
                      {alt.latestVersion && (
                        <span className="font-mono text-[11px] text-[#64748b] bg-[#f1f6fd] px-2 py-0.5 rounded-[6px]">
                          v{alt.latestVersion}
                        </span>
                      )}
                      {alt.license && (
                        <span className="font-mono text-[10px] text-[#64748b] bg-[#f8fbff] border border-[#dce7f5] px-1.5 py-0.5 rounded">
                          {alt.license}
                        </span>
                      )}
                    </div>

                    <p className="text-[13px] text-[#64748b] line-clamp-2 max-w-2xl leading-relaxed">
                      {alt.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center gap-4 pt-1 text-[11.5px] text-[#64748b]">
                      {alt.weeklyDownloads !== undefined && (
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3 text-[#0558d6]" />
                          <strong>{formatNumber(alt.weeklyDownloads)}</strong> / wk
                        </span>
                      )}
                      {(alt.starsCount || alt.stars) !== undefined && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          <strong>{formatNumber(alt.starsCount || alt.stars)}</strong>
                        </span>
                      )}
                      {alt.reason && (
                        <span className="text-[11px] text-[#0558d6] font-medium bg-[#eff6ff] px-2 py-0.5 rounded-full border border-[#bfdbfe]/50">
                          {alt.reason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Compare button & View */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {onCompareWith && (
                      <KeycapButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onCompareWith(alt.name)}
                        className="flex items-center gap-1.5 text-[12px]"
                      >
                        <Scale className="h-3.5 w-3.5 text-[#0558d6]" />
                        Compare
                      </KeycapButton>
                    )}
                    <Link
                      href={`/?ecosystem=${ecosystem}&package=${encodeURIComponent(alt.name)}`}
                      className="p-2 rounded-[10px] bg-[#f8fbff] hover:bg-[#eff6ff] text-[#64748b] hover:text-[#0558d6] transition-colors"
                      title={`Inspect ${alt.name}`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty Alternatives State */}
          {!altLoading && !altError && functionalAlternatives.length === 0 && (
            <div className="p-8 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] text-center flex flex-col items-center justify-center shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
              <div className="w-12 h-12 rounded-full bg-[#f8fbff] text-[#64748b] flex items-center justify-center mb-3">
                <Shuffle className="h-6 w-6" />
              </div>
              <h4 className="font-sans font-bold text-[16px] text-[#0f172a]">No Direct Alternatives Registered</h4>
              <p className="text-[13px] text-[#475569] max-w-[420px] mt-1">
                There are currently no alternative recommendations registered for <strong className="font-mono text-[#0f172a]">{packageName}</strong> in the {ecosystem.toUpperCase()} catalog.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
