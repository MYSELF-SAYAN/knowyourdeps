'use client';

import React, { useEffect, useState } from 'react';
import { Ecosystem, DependencyData, DependencyRequirement, DependencyNode } from '@/lib/types';
import { Layers, Search, ExternalLink, RefreshCw, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, GitFork } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { KeycapButton } from '../ui/KeycapButton';
import Link from 'next/link';

interface DependenciesTabProps {
  ecosystem: Ecosystem;
  packageName: string;
  version: string;
}

export function DependenciesTab({ ecosystem, packageName, version }: DependenciesTabProps) {
  const [data, setData] = useState<DependencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'requirements' | 'graph'>('requirements');

  const fetchDependencies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/package/dependencies?ecosystem=${ecosystem}&name=${encodeURIComponent(packageName)}&version=${encodeURIComponent(version)}`
      );
      if (!res.ok) throw new Error('Failed to load dependency graph');
      const json: DependencyData = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error loading dependencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, [ecosystem, packageName, version]);

  const filteredRequirements = data?.requirements.filter((req) =>
    req.name.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  const filteredGraph = data?.resolvedGraph?.filter((node) =>
    node.name.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Stat Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Direct Dependencies Card */}
        <div className="p-5 bg-white border border-[#e8e8e8] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[#6e6e6e]">
            <span className="text-[12px] font-semibold uppercase tracking-wider">Direct Requirements</span>
            <Layers className="h-4 w-4 text-[#a6a6a6]" />
          </div>
          {loading ? (
            <div className="my-2 h-8 w-20 bg-[#f0f0f0] rounded-[6px] animate-pulse" />
          ) : (
            <div className="mt-2 font-display text-[28px] font-bold text-[#1a1a1a] tabular-nums">
              {data?.totalDirect ?? 0}
            </div>
          )}
          <p className="mt-1 text-[11px] text-[#555a64]">Declared directly in package manifest</p>
        </div>

        {/* Transitive Dependencies Card */}
        <div className="p-5 bg-white border border-[#e8e8e8] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[#6e6e6e]">
            <span className="text-[12px] font-semibold uppercase tracking-wider">Resolved Graph Nodes</span>
            <GitFork className="h-4 w-4 text-[#a6a6a6]" />
          </div>
          {loading ? (
            <div className="my-2 h-8 w-20 bg-[#f0f0f0] rounded-[6px] animate-pulse" />
          ) : (
            <div className="mt-2 font-display text-[28px] font-bold text-[#1a1a1a] tabular-nums">
              {data?.totalTransitive ?? data?.resolvedGraph?.length ?? 0}
            </div>
          )}
          <p className="mt-1 text-[11px] text-[#555a64]">Resolved by deps.dev v3 solver</p>
        </div>

        {/* Tree Complexity / Footprint */}
        <div className="p-5 bg-white border border-[#e8e8e8] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[#6e6e6e]">
            <span className="text-[12px] font-semibold uppercase tracking-wider">Dependency Health</span>
            <CheckCircle2 className="h-4 w-4 text-[#17a45c]" />
          </div>
          <div className="mt-2 text-[18px] font-bold text-[#1a1a1a]">
            {loading
              ? 'Evaluating...'
              : (data?.totalDirect ?? 0) === 0
              ? 'Zero-Dependency'
              : (data?.totalDirect ?? 0) < 5
              ? 'Lightweight'
              : 'Moderate Tree'}
          </div>
          <p className="mt-1 text-[11px] text-[#555a64]">
            {(data?.totalDirect ?? 0) === 0 ? 'No external runtime footprint' : 'Tree size and blast radius'}
          </p>
        </div>
      </div>

      {/* Control bar: Search & Mode toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#e8e8e8] p-3 rounded-[16px]">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#f4f4f4] p-1 rounded-[10px] self-start sm:self-auto">
          <button
            onClick={() => setViewMode('requirements')}
            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all ${
              viewMode === 'requirements'
                ? 'bg-white text-[#1a1a1a] shadow-sm font-semibold'
                : 'text-[#6e6e6e] hover:text-[#1a1a1a]'
            }`}
          >
            Direct Requirements ({data?.requirements.length ?? 0})
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all ${
              viewMode === 'graph'
                ? 'bg-white text-[#1a1a1a] shadow-sm font-semibold'
                : 'text-[#6e6e6e] hover:text-[#1a1a1a]'
            }`}
          >
            Resolved Graph ({data?.resolvedGraph?.length ?? 0})
          </button>
        </div>

        {/* Filter input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555a64]" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter dependencies by name..."
            className="w-full pl-9 pr-3 py-1.5 text-[12px] bg-[#f8f8f8] border border-[#e8e8e8] rounded-[8px] focus:outline-none focus:border-[#1d53c6] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-[#f4f4f4] rounded-[12px] animate-pulse" />
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white border border-[#e8e8e8] rounded-[16px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] animate-in fade-in duration-150">
          <div className="px-5 py-3.5 border-b border-[#f0f0f0] bg-[#fafafa] flex items-center justify-between">
            <div className="h-4 w-28 bg-[#f0f0f0] rounded animate-pulse" />
            <div className="h-4 w-32 bg-[#f0f0f0] rounded animate-pulse" />
          </div>
          <div className="divide-y divide-[#f0f0f0] p-2 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-36 bg-[#f0f0f0] rounded" />
                  <div className="h-4 w-10 bg-[#f0f0f0] rounded" />
                </div>
                <div className="h-6 w-20 bg-[#f0f0f0] rounded-[6px]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-6 bg-[#feecee] border border-[#fcccd1] rounded-[16px] text-[#e5484d] flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-[14px]">Unable to load dependency graph</p>
            <p className="text-[12px] opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Zero Dependencies Banner */}
      {data && data.requirements.length === 0 && !loading && (
        <div className="bg-white border border-[#e8e8e8] rounded-[20px] p-8 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#eefcf3] text-[#17a45c] flex items-center justify-center mb-3">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h4 className="font-sans font-bold text-[18px] text-[#1a1a1a]">Zero Runtime Dependencies</h4>
          <p className="text-[13px] text-[#6e6e6e] max-w-[440px] mt-2">
            <span className="font-mono font-medium text-[#1a1a1a]">{packageName}@{version}</span> does not declare any external production dependencies. It has no upstream supply chain exposure!
          </p>
        </div>
      )}

      {/* Requirements View */}
      {viewMode === 'requirements' && data && data.requirements.length > 0 && (
        <div className="bg-white border border-[#e8e8e8] rounded-[16px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="px-5 py-3.5 border-b border-[#f0f0f0] bg-[#fafafa] flex items-center justify-between text-[12px] font-semibold text-[#6e6e6e]">
            <span>Package Name</span>
            <span>Version Constraint</span>
          </div>

          <div className="divide-y divide-[#f0f0f0]">
            {filteredRequirements.map((req) => (
              <div
                key={req.name}
                className="px-5 py-3 flex items-center justify-between hover:bg-[#fbfbfb] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/?ecosystem=${ecosystem}&package=${encodeURIComponent(req.name)}&type=overview`}
                    className="font-mono text-[14px] font-semibold text-[#1a1a1a] group-hover:text-[#1d53c6] hover:underline flex items-center gap-1.5"
                  >
                    {req.name}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#1d53c6]" />
                  </Link>
                  {req.isDev && (
                    <Badge variant="default" size="sm">
                      dev
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[12px] bg-[#f4f4f4] border border-[#e8e8e8] px-2.5 py-1 rounded-[6px] text-[#4a4a4a]">
                    {req.constraint || '*'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Graph View */}
      {viewMode === 'graph' && data && (
        <div className="bg-white border border-[#e8e8e8] rounded-[16px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="px-5 py-3.5 border-b border-[#f0f0f0] bg-[#fafafa] flex items-center justify-between text-[12px] font-semibold text-[#6e6e6e]">
            <span>Resolved Package</span>
            <span>Relation</span>
          </div>

          {filteredGraph.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#555a64]">
              No resolved graph nodes match your query.
            </div>
          ) : (
            <div className="divide-y divide-[#f0f0f0]">
              {filteredGraph.map((node, idx) => (
                <div
                  key={`${node.name}-${node.version}-${idx}`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[#fbfbfb] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        node.relation === 'DIRECT' ? 'bg-[#1d53c6]' : 'bg-[#a6a6a6]'
                      }`}
                    />
                    <Link
                      href={`/?ecosystem=${ecosystem}&package=${encodeURIComponent(node.name)}&type=overview`}
                      className="font-mono text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#1d53c6] hover:underline"
                    >
                      {node.name}
                    </Link>
                    <span className="font-mono text-[12px] text-[#6e6e6e]">@{node.version}</span>
                  </div>

                  <div>
                    <Badge variant={node.relation === 'DIRECT' ? 'primary' : 'default'} size="sm">
                      {node.relation}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footnote */}
      {data && (
        <div className="text-[11px] text-[#555a64] flex items-center justify-between">
          <span>Source: {data.source}</span>
          <span>{data.note}</span>
        </div>
      )}
    </div>
  );
}
