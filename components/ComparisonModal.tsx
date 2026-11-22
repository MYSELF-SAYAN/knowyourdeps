'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Ecosystem,
  ComparisonTarget,
  ComparisonResultItem,
  SearchResultItem,
} from '@/lib/types';
import {
  X,
  Plus,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Download,
  Layers,
  ArrowUpRight,
  Trash2,
  RefreshCw,
  Award,
  Calendar,
  FileCode,
  Sparkles,
  GitFork,
  Star,
  Check,
  ChevronDown,
  Search,
  Zap,
  Activity,
  HardDrive,
  Code2,
  Terminal,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { KeycapButton } from './ui/KeycapButton';
import Link from 'next/link';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPackages: ComparisonTarget[];
}

const POPULAR_RIVALS: Record<Ecosystem, string[]> = {
  npm: ['axios', 'got', 'ky', 'express', 'fastify', 'react', 'preact', 'vue'],
  pypi: ['requests', 'httpx', 'flask', 'fastapi', 'urllib3', 'aiohttp', 'pydantic'],
};

export function ComparisonModal({ isOpen, onClose, initialPackages }: ComparisonModalProps) {
  const [packageList, setPackageList] = useState<ComparisonTarget[]>(initialPackages);
  const [data, setData] = useState<ComparisonResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightLeaders, setHighlightLeaders] = useState(true);

  // Add package input & suggestions state
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgEcosystem, setNewPkgEcosystem] = useState<Ecosystem>('npm');
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active version dropdown column index
  const [activeVersionDropdown, setActiveVersionDropdown] = useState<number | null>(null);
  const [versionFilterQuery, setVersionFilterQuery] = useState('');

  const inputContainerRef = useRef<HTMLDivElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);

  // Sync initial packages
  useEffect(() => {
    if (initialPackages.length > 0) {
      setPackageList(initialPackages);
    }
  }, [initialPackages]);

  // Keyboard accessibility: Dismiss modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeVersionDropdown !== null) {
          setActiveVersionDropdown(null);
        } else if (isSuggestionsOpen) {
          setIsSuggestionsOpen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, activeVersionDropdown, isSuggestionsOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(e.target as Node)) {
        setActiveVersionDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch live autocomplete search suggestions while typing
  useEffect(() => {
    const trimmed = newPkgName.trim();
    if (!trimmed || trimmed.includes('@')) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const res = await fetch(
          `/api/search?ecosystem=${newPkgEcosystem}&q=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const json = await res.json();
          setSuggestions(json.results || []);
          setIsSuggestionsOpen(true);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [newPkgName, newPkgEcosystem]);

  // Fetch comparison data whenever packageList changes
  useEffect(() => {
    if (!isOpen || packageList.length === 0) return;

    const fetchComparison = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packages: packageList }),
        });
        if (!res.ok) throw new Error('Failed to run package comparison');
        const json = await res.json();
        setData(json.results || []);
      } catch (err: any) {
        setError(err.message || 'Comparison request failed');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [isOpen, packageList]);

  if (!isOpen) return null;

  // Add package to comparison list
  const addPackageTarget = (rawName: string, eco: Ecosystem = newPkgEcosystem) => {
    const trimmed = rawName.trim();
    if (!trimmed) return;

    if (packageList.length >= 4) {
      setError('You can compare at most 4 packages or versions simultaneously');
      return;
    }

    let parsedName = trimmed;
    let parsedVersion: string | undefined = undefined;

    // Check for inline name@version syntax (e.g. react@18.2.0 or @scope/pkg@1.0.0)
    if (trimmed.includes('@')) {
      const lastAt = trimmed.lastIndexOf('@');
      if (lastAt > 0) {
        parsedVersion = trimmed.slice(lastAt + 1);
        parsedName = trimmed.slice(0, lastAt);
      }
    }

    // Check duplicate target (same ecosystem, name, and version)
    const exists = packageList.some(
      (p) =>
        p.name.toLowerCase() === parsedName.toLowerCase() &&
        p.ecosystem === eco &&
        (p.version || 'latest') === (parsedVersion || 'latest')
    );

    if (exists) {
      setError(`"${parsedName}${parsedVersion ? `@${parsedVersion}` : ''}" is already in comparison`);
      return;
    }

    setPackageList([
      ...packageList,
      { ecosystem: eco, name: parsedName, version: parsedVersion },
    ]);
    setNewPkgName('');
    setIsSuggestionsOpen(false);
    setError(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPackageTarget(newPkgName, newPkgEcosystem);
  };

  const handleRemovePackage = (index: number) => {
    const updated = packageList.filter((_, i) => i !== index);
    setPackageList(updated);
  };

  // Real-time Version Switcher: changes the version of a specific package in the comparison
  const handleSwitchVersion = (targetIndex: number, newVersion: string) => {
    const updated = [...packageList];
    if (updated[targetIndex]) {
      updated[targetIndex] = {
        ...updated[targetIndex],
        version: newVersion,
      };
      setPackageList(updated);
    }
    setActiveVersionDropdown(null);
    setVersionFilterQuery('');
  };

  // Format bytes helper
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Format number helper
  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '—';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  // Compute Best-in-Class Highlights across active comparison items
  const maxWeeklyDownloads = Math.max(
    ...data.map((d) => d.overview.totalDownloadsWeekly || d.analytics?.totalDownloads || 0),
    0
  );
  const minActiveCVEs = Math.min(
    ...data.map((d) => d.security.advisories.filter((a) => a.affectsSelectedVersion).length),
    99
  );
  const minDirectDeps = Math.min(
    ...data.map((d) => d.deps?.totalDirect ?? d.overview.dependenciesCount ?? 0)
  );
  const minSize = Math.min(
    ...data.map((d) => d.overview.unpackedSize || Infinity)
  );
  const maxStars = Math.max(
    ...data.map((d) => d.overview.starsCount || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
    >
      <div className="bg-white border border-[#e8e8e8] rounded-[24px] shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#eff6ff] border border-[#bfdbfe] text-[#1d53c6] flex items-center justify-center shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="comparison-title" className="font-display font-bold text-[19px] text-[#0f172a]">
                  Side-by-Side Deep Matrix
                </h3>
                <Badge variant="accent" size="sm">
                  Real-time Compare
                </Badge>
              </div>
              <p className="text-[12px] text-[#64748b] mt-0.5">
                Benchmark downloads, supply chain security, and geometry across packages and specific releases.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Toggle Best in Class Highlights */}
            <button
              type="button"
              onClick={() => setHighlightLeaders(!highlightLeaders)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all cursor-pointer border ${
                highlightLeaders
                  ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#1d53c6] shadow-xs'
                  : 'bg-white border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a]'
              }`}
              title="Highlight leaders in each metric"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Highlight Leaders</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison matrix"
              className="w-8 h-8 rounded-full hover:bg-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Add Package & Autocomplete Suggestions Bar */}
        <div className="px-6 py-3.5 bg-white border-b border-[#f0f0f0]">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2" ref={inputContainerRef}>
              {/* Ecosystem Selector */}
              <div className="flex items-center rounded-[10px] bg-[#f1f5f9] p-0.5 border border-[#e2e8f0]">
                {(['npm', 'pypi'] as const).map((eco) => (
                  <button
                    key={eco}
                    type="button"
                    onClick={() => {
                      setNewPkgEcosystem(eco);
                      setSuggestions([]);
                    }}
                    className={`px-3 py-1 text-[11.5px] font-bold rounded-[8px] transition-all cursor-pointer ${
                      newPkgEcosystem === eco
                        ? 'bg-[#1d53c6] text-white shadow-xs'
                        : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                  >
                    {eco.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Package input with live autocomplete */}
              <div className="relative flex-1 min-w-[240px]">
                <form onSubmit={handleAddSubmit} className="relative w-full">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-3.5 w-3.5 text-[#94a3b8]" />
                    <input
                      type="text"
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0) setIsSuggestionsOpen(true);
                      }}
                      placeholder={`Search ${newPkgEcosystem} package or type pkg@version (e.g. react@18.2.0)...`}
                      disabled={packageList.length >= 4}
                      className="w-full pl-9 pr-9 py-2 text-[12.5px] bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] focus:outline-none focus:border-[#1d53c6] focus:bg-white transition-colors"
                    />
                    {isSearchingSuggestions && (
                      <RefreshCw className="absolute right-3 h-3.5 w-3.5 animate-spin text-[#1d53c6]" />
                    )}
                  </div>
                </form>

                {/* Autocomplete Dropdown */}
                {isSuggestionsOpen && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#e2e8f0] rounded-[16px] shadow-xl z-50 p-1.5 max-h-[260px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    <span className="px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-[#94a3b8] block">
                      Matching {newPkgEcosystem.toUpperCase()} Packages
                    </span>
                    {suggestions.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => addPackageTarget(item.name, newPkgEcosystem)}
                        className="w-full px-3 py-2 text-left rounded-[10px] hover:bg-[#eff6ff] transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[13px] text-[#0f172a] group-hover:text-[#1d53c6]">
                              {item.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.2 rounded">
                              v{item.version}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-[#64748b] line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-[#1d53c6] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <KeycapButton
                type="button"
                variant="primary"
                size="sm"
                onClick={() => addPackageTarget(newPkgName, newPkgEcosystem)}
                disabled={packageList.length >= 4 || !newPkgName.trim() || loading}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add to Matrix
              </KeycapButton>

              {loading && <RefreshCw className="h-4 w-4 animate-spin text-[#1d53c6] ml-1" />}
            </div>

            {/* Quick Rival Suggestion Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[#64748b] pt-0.5">
              <span className="font-semibold text-[#0f172a]">Popular comparisons:</span>
              {POPULAR_RIVALS[newPkgEcosystem].map((pkg) => (
                <button
                  key={pkg}
                  type="button"
                  onClick={() => addPackageTarget(pkg, newPkgEcosystem)}
                  disabled={packageList.length >= 4}
                  className="px-2 py-0.5 rounded-[6px] bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:text-[#1d53c6] transition-colors cursor-pointer"
                >
                  +{pkg}
                </button>
              ))}
            </div>

            {error && <p className="text-[12px] text-[#e5484d] font-medium">{error}</p>}
          </div>
        </div>

        {/* Matrix Tabular View */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 scrollbar-thin">
          {loading && data.length === 0 && (
            <div className="min-w-[700px] animate-pulse space-y-3">
              <div className="h-20 bg-[#f8fafc] rounded-[14px] border border-[#e2e8f0]" />
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 bg-[#f8fafc] rounded-[10px] border border-[#f1f5f9]" />
              ))}
            </div>
          )}

          {data.length === 0 && !loading && (
            <div className="p-12 text-center text-[#64748b] text-[14px]">
              No packages selected. Add packages above to generate the comparative matrix.
            </div>
          )}

          {data.length > 0 && (
            <div className="min-w-[720px]">
              <table className="w-full border-collapse table-fixed">
                {/* Column Headers with Package Name & Real-Time Version Selector Dropdown */}
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="w-[170px] p-3 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-wider bg-[#fafafa] rounded-tl-[14px]">
                      Metric & Spec
                    </th>
                    {data.map((item, idx) => {
                      const isDropdownOpen = activeVersionDropdown === idx;
                      const allVersions = item.versions || [];
                      const filteredVersions = allVersions.filter((v) =>
                        v.version.toLowerCase().includes(versionFilterQuery.toLowerCase())
                      );

                      return (
                        <th
                          key={`${item.overview.name}-${item.selectedVersion}-${idx}`}
                          className="p-3 text-left bg-[#f8fafc] border-l border-[#e2e8f0] align-top relative"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0 flex-1">
                              <Badge variant="accent" size="sm">
                                {item.overview.ecosystem.toUpperCase()}
                              </Badge>

                              <Link
                                href={`/?ecosystem=${item.overview.ecosystem}&package=${encodeURIComponent(
                                  item.overview.name
                                )}&type=overview`}
                                onClick={onClose}
                                className="font-mono text-[15px] font-bold text-[#0f172a] hover:text-[#1d53c6] transition-colors flex items-center gap-1 mt-1 truncate group"
                              >
                                <span className="truncate">{item.overview.name}</span>
                                <ArrowUpRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>

                              {/* Real-time Version Switcher Dropdown */}
                              <div className="relative mt-1.5" ref={isDropdownOpen ? versionDropdownRef : null}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveVersionDropdown(isDropdownOpen ? null : idx);
                                    setVersionFilterQuery('');
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-white border border-[#bfdbfe] hover:border-[#1d53c6] text-[11.5px] font-mono font-bold text-[#1d53c6] shadow-2xs transition-all cursor-pointer"
                                  title="Click to switch version in real-time"
                                >
                                  <span>v{item.selectedVersion}</span>
                                  <ChevronDown
                                    className={`h-3 w-3 transition-transform duration-150 ${
                                      isDropdownOpen ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>

                                {/* Version Selector Popover */}
                                {isDropdownOpen && (
                                  <div className="absolute left-0 top-full mt-1.5 w-56 bg-white border border-[#e2e8f0] rounded-[14px] shadow-2xl z-50 p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#94a3b8]" />
                                      <input
                                        type="text"
                                        value={versionFilterQuery}
                                        onChange={(e) => setVersionFilterQuery(e.target.value)}
                                        placeholder="Filter versions..."
                                        className="w-full pl-7 pr-2 py-1 text-[11px] font-mono bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] focus:outline-none focus:border-[#1d53c6]"
                                        autoFocus
                                      />
                                    </div>

                                    <div className="max-h-48 overflow-y-auto divide-y divide-[#f1f5f9] scrollbar-thin">
                                      {filteredVersions.length === 0 ? (
                                        <div className="p-2 text-center text-[10.5px] text-[#64748b]">
                                          No versions match
                                        </div>
                                      ) : (
                                        filteredVersions.map((v) => {
                                          const isSelected = v.version === item.selectedVersion;
                                          return (
                                            <button
                                              key={v.version}
                                              type="button"
                                              onClick={() => handleSwitchVersion(idx, v.version)}
                                              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-mono rounded-[6px] flex items-center justify-between transition-colors cursor-pointer ${
                                                isSelected
                                                  ? 'bg-[#eff6ff] text-[#1d53c6] font-bold'
                                                  : 'hover:bg-[#f8fafc] text-[#0f172a]'
                                              }`}
                                            >
                                              <span>v{v.version}</span>
                                              {isSelected && <Check className="h-3 w-3 text-[#1d53c6]" />}
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemovePackage(idx)}
                              className="w-7 h-7 rounded-[8px] hover:bg-[#feecee] text-[#94a3b8] hover:text-[#e5484d] transition-colors flex items-center justify-center cursor-pointer shrink-0"
                              title={`Remove ${item.overview.name}`}
                              aria-label={`Remove ${item.overview.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#e2e8f0] text-[12px]">
                  {/* Row: Weekly Downloads */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5 text-[#1d53c6]" />
                        <span>Weekly Downloads</span>
                      </div>
                    </td>
                    {data.map((item, idx) => {
                      const dls = item.overview.totalDownloadsWeekly || item.analytics?.totalDownloads || 0;
                      const isLeader = highlightLeaders && dls > 0 && dls === maxWeeklyDownloads && data.length > 1;
                      return (
                        <td
                          key={idx}
                          className={`p-3 border-l border-[#e2e8f0] font-mono tabular-nums ${
                            isLeader ? 'bg-[#eff6ff]/60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#0f172a]">
                              {dls ? dls.toLocaleString() : 'N/A'}
                            </span>
                            {isLeader && (
                              <Badge variant="accent" size="sm" className="text-[10px] py-0 px-1.5">
                                <Award className="h-2.5 w-2.5 mr-0.5" /> Leader
                              </Badge>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: 30-Day Velocity & Daily Avg */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-[#17a45c]" />
                        <span>Daily Velocity Avg</span>
                      </div>
                    </td>
                    {data.map((item, idx) => {
                      const dailyAvg = item.analytics?.dailyAverage;
                      return (
                        <td key={idx} className="p-3 border-l border-[#e2e8f0] font-mono tabular-nums">
                          <span className="font-bold text-[#0f172a]">
                            {dailyAvg ? `~${dailyAvg.toLocaleString()} / day` : '—'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Active CVEs in Selected Version */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#17a45c]" />
                        <span>Active CVEs (v{data[0]?.selectedVersion ? '...' : ''})</span>
                      </div>
                    </td>
                    {data.map((item, idx) => {
                      const activeCVEs = item.security.advisories.filter((a) => a.affectsSelectedVersion).length;
                      const isSafest = highlightLeaders && activeCVEs === minActiveCVEs && activeCVEs === 0 && data.length > 1;
                      return (
                        <td
                          key={idx}
                          className={`p-3 border-l border-[#e2e8f0] ${
                            isSafest ? 'bg-[#eefcf3]/60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {activeCVEs === 0 ? (
                              <Badge variant="success" size="sm">
                                0 Active CVEs (Clean)
                              </Badge>
                            ) : (
                              <Badge variant="danger" size="sm">
                                {activeCVEs} Active CVE{activeCVEs > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {isSafest && (
                              <span className="text-[10px] font-bold text-[#17a45c] uppercase">
                                Safest
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Lifetime Historical CVE Records */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-[#f59e0b]" />
                        <span>Historical Advisories</span>
                      </div>
                    </td>
                    {data.map((item, idx) => {
                      const totalHist =
                        item.security.allHistoricalAdvisories?.length ??
                        item.overview.vulnerabilitiesCount ??
                        0;
                      return (
                        <td key={idx} className="p-3 border-l border-[#e2e8f0] font-mono">
                          <span className="font-semibold text-[#0f172a]">{totalHist}</span>
                          <span className="text-[#64748b] text-[11px] ml-1">total ecosystem CVEs</span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Direct Dependencies */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-[#1d53c6]" />
                        <span>Direct Dependencies</span>
                      </div>
                    </td>
                    {data.map((item, idx) => {
                      const direct = item.deps?.totalDirect ?? item.overview.dependenciesCount ?? 0;
                      const isLeanest = highlightLeaders && direct === minDirectDeps && data.length > 1;
                      return (
                        <td
                          key={idx}
                          className={`p-3 border-l border-[#e2e8f0] font-mono ${
                            isLeanest ? 'bg-[#eff6ff]/60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#0f172a]">{direct}</span>
                            <span className="text-[#64748b] text-[11px]">direct</span>
                            {isLeanest && (
                              <span className="text-[10px] font-bold text-[#1d53c6] uppercase">
                                Leanest
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Transitive Graph Complexity */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <GitFork className="h-3.5 w-3.5 text-[#64748b]" />
                        <span>Transitive Nodes</span>
                      </div>
                    </td>
                    {data.map((item, idx) => {
                      const transitive = item.deps?.totalTransitive ?? item.deps?.resolvedGraph?.length ?? 0;
                      return (
                        <td key={idx} className="p-3 border-l border-[#e2e8f0] font-mono">
                          <span className="font-semibold text-[#0f172a]">{transitive}</span>
                          <span className="text-[#64748b] text-[11px] ml-1">nodes resolved</span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Unpacked Size */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-[#64748b]" />
                        <span>Unpacked Size</span>
                      </div>
                    </td>
                    {data.map((item, idx) => {
                      const size = item.overview.unpackedSize;
                      const isLightest = highlightLeaders && size && size === minSize && data.length > 1;
                      return (
                        <td
                          key={idx}
                          className={`p-3 border-l border-[#e2e8f0] font-mono ${
                            isLightest ? 'bg-[#eff6ff]/60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#0f172a]">{formatBytes(size)}</span>
                            {isLightest && (
                              <span className="text-[10px] font-bold text-[#1d53c6] uppercase">
                                Lightest
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Files Count */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <FileCode className="h-3.5 w-3.5 text-[#64748b]" />
                        <span>Package Files</span>
                      </div>
                    </td>
                    {data.map((item, idx) => (
                      <td key={idx} className="p-3 border-l border-[#e2e8f0] font-mono text-[#0f172a]">
                        {item.overview.fileCount !== undefined ? `${item.overview.fileCount} files` : '—'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Type Definitions */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5 text-[#1d53c6]" />
                        <span>Type Definitions</span>
                      </div>
                    </td>
                    {data.map((item, idx) => (
                      <td key={idx} className="p-3 border-l border-[#e2e8f0]">
                        <span className="font-medium text-[11px] text-[#0f172a] bg-[#f1f5f9] px-2 py-0.5 rounded-[6px]">
                          {item.overview.typeDefinitionsType || (item.overview.hasTypeDefinitions ? 'Bundled' : 'Not Bundled')}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Required Runtime Engine */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-[#64748b]" />
                        <span>Required Runtime</span>
                      </div>
                    </td>
                    {data.map((item, idx) => (
                      <td key={idx} className="p-3 border-l border-[#e2e8f0] font-mono text-[11px] text-[#64748b]">
                        {item.overview.requiresRuntime || (item.overview.ecosystem === 'npm' ? 'Node.js' : 'Python >= 3')}
                      </td>
                    ))}
                  </tr>

                  {/* Row: License */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <FileCode className="h-3.5 w-3.5 text-[#64748b]" />
                        <span>License</span>
                      </div>
                    </td>
                    {data.map((item, idx) => (
                      <td key={idx} className="p-3 border-l border-[#e2e8f0]">
                        <Badge variant="default" size="sm">
                          {item.overview.license || 'Unknown'}
                        </Badge>
                      </td>
                    ))}
                  </tr>

                  {/* Row: GitHub Stars */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        <span>GitHub Stars</span>
                      </div>
                    </td>
                    {data.map((item, idx) => {
                      const stars = item.overview.starsCount || 0;
                      const isLeader = highlightLeaders && stars > 0 && stars === maxStars && data.length > 1;
                      return (
                        <td
                          key={idx}
                          className={`p-3 border-l border-[#e2e8f0] font-mono tabular-nums ${
                            isLeader ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#0f172a]">
                              {stars ? formatNumber(stars) : '—'}
                            </span>
                            {isLeader && (
                              <span className="text-[10px] font-bold text-amber-600 uppercase">
                                Top Starred
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Open Issues */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-[#64748b]" />
                        <span>Open Issues</span>
                      </div>
                    </td>
                    {data.map((item, idx) => (
                      <td key={idx} className="p-3 border-l border-[#e2e8f0] font-mono text-[#0f172a]">
                        {item.overview.openIssuesCount !== undefined ? item.overview.openIssuesCount.toLocaleString() : '—'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Release Date */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#64748b]" />
                        <span>Release Date</span>
                      </div>
                    </td>
                    {data.map((item, idx) => (
                      <td key={idx} className="p-3 border-l border-[#e2e8f0] text-[#64748b] text-[11px] font-mono">
                        {item.overview.publishedAt
                          ? new Date(item.overview.publishedAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Deep Dive Action */}
                  <tr>
                    <td className="p-3 font-semibold text-[#64748b] bg-[#fafafa] rounded-bl-[14px]">
                      <span>Deep Dive</span>
                    </td>
                    {data.map((item, idx) => (
                      <td key={idx} className="p-3 border-l border-[#e2e8f0]">
                        <Link
                          href={`/?ecosystem=${item.overview.ecosystem}&package=${encodeURIComponent(
                            item.overview.name
                          )}&version=${encodeURIComponent(item.selectedVersion)}&type=overview`}
                          onClick={onClose}
                          className="w-full text-center py-1.5 px-3 bg-white hover:bg-[#eff6ff] border border-[#e2e8f0] hover:border-[#bfdbfe] rounded-[8px] text-[11.5px] font-bold text-[#0f172a] hover:text-[#1d53c6] transition-all flex items-center justify-center gap-1"
                        >
                          <span>Inspect {item.overview.name}@v{item.selectedVersion}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center justify-between">
          <span className="text-[12px] text-[#64748b]">
            {data.length} of 4 slots used • Select version dropdown in column header to switch release in real-time
          </span>
          <KeycapButton variant="secondary" size="sm" onClick={onClose}>
            Close Matrix
          </KeycapButton>
        </div>
      </div>
    </div>
  );
}
